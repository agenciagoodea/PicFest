import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook received:", payload);

    const { action, type, data } = payload;
    const resourceId = data?.id;

    // 1. Registrar evento para auditoria e idempotência
    const { data: eventRecord, error: eventError } = await supabase
      .from("webhook_events")
      .insert({
        topic: type,
        action: action,
        mercado_pago_resource_id: resourceId,
        payload_json: payload
      })
      .select()
      .single();

    if (eventError) {
      console.error("Erro ao registrar evento:", eventError);
    }

    // 2. Processar apenas se for um pagamento
    if (type === "payment") {
      const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      
      // Consultar status real no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` }
      });
      
      if (!mpResponse.ok) throw new Error("Falha ao consultar pagamento no Mercado Pago");
      
      const mpPayment = await mpResponse.json();
      console.log("MP Payment Detail:", mpPayment.status);

      // 3. Atualizar tabela de pagamentos
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update({
          status: mpPayment.status,
          status_detail: mpPayment.status_detail,
          paid_at: mpPayment.date_approved,
          raw_response_json: mpPayment
        })
        .eq("mercado_pago_payment_id", resourceId.toString())
        .select()
        .single();

      if (updateError) console.error("Erro ao atualizar pagamento:", updateError);

      // 4. Se aprovado, ativar ou renovar a assinatura
      if (mpPayment.status === "approved" && updatedPayment) {
        const { tenant_id, plan_id, subscription_id } = updatedPayment;

        // Buscar detalhes do plano para calcular expiração
        const { data: plan } = await supabase.from("plans").select("*").eq("id", plan_id).single();
        
        if (plan) {
          let expiresAt = new Date();
          if (plan.interval === "month") expiresAt.setMonth(expiresAt.getMonth() + plan.interval_count);
          else if (plan.interval === "year") expiresAt.setFullYear(expiresAt.getFullYear() + plan.interval_count);
          else if (plan.interval === "day") expiresAt.setDate(expiresAt.getDate() + plan.interval_count);
          else if (plan.interval === "unique") expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Plano vitalício/único

          // Registrar ou atualizar a assinatura
          if (subscription_id) {
            const { error: subError } = await supabase
              .from("subscriptions")
              .update({
                status: "active",
                expires_at: expiresAt.toISOString(),
                renewal_date: expiresAt.toISOString(),
                external_reference: mpPayment.external_reference
              })
              .eq("id", subscription_id);
              if (subError) console.error("Erro ao atualizar assinatura:", subError);
          } else {
            const { error: subError } = await supabase
              .from("subscriptions")
              .insert({
                tenant_id,
                plan_id,
                status: "active",
                started_at: mpPayment.date_approved || new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                renewal_date: expiresAt.toISOString(),
                external_reference: mpPayment.external_reference
              });
              if (subError) console.error("Erro ao inserir nova assinatura:", subError);
          }
          
          // Log de sucesso
          await supabase.from("integration_logs").insert({
            context: "webhook_processing",
            level: "info",
            message: `Assinatura ativada para tenant ${tenant_id}`,
            metadata_json: { payment_id: mpPayment.id, plan_id }
          });
        }
      }
    }

    // Marca como processado
    if (eventRecord) {
      await supabase.from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("id", eventRecord.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
