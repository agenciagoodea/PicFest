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

    // 1. Registrar evento para auditoria
    const { data: eventRecord, error: eventError } = await supabase
      .from("webhook_events")
      .insert({
        topic: type,
        action: action,
        mercado_pago_resource_id: resourceId,
        payload_json: payload,
        processed: false
      })
      .select()
      .single();

    // 2. Processar apenas se for um pagamento
    if (type === "payment") {
      await supabase.from("integration_logs").insert({
        context: "webhook", level: "info", message: `Iniciando processamento pagamento ${resourceId}`
      });

      // Buscar Token
      const { data: configRow } = await supabase
        .from("configuracao_geral")
        .select("conteudo")
        .eq("id", "mercadopago_config")
        .maybeSingle();

      const mpAccessToken = configRow?.conteudo?.mercadopago?.accessToken || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!mpAccessToken) throw new Error("Token MP não encontrado no banco");

      // Consultar status no MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` }
      });
      
      if (!mpResponse.ok) {
        if (mpResponse.status === 404) {
          console.warn(`ID ${resourceId} 404 no MP. Marcando processado.`);
          if (eventRecord) await supabase.from("webhook_events").update({ processed: true }).eq("id", eventRecord.id);
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
        }
        throw new Error(`Erro API MP: ${mpResponse.status}`);
      }
      
      const mpPayment = await mpResponse.json();
      const mpStatus = mpPayment.status;
      const mpExtRef = mpPayment.external_reference;

      // 3. BUSCA DUPLA: Tenta por ID MP local, se não achar, tenta por External Reference
      let { data: updatedPayment } = await supabase
        .from("payments")
        .update({
          status: mpStatus,
          status_detail: mpPayment.status_detail,
          paid_at: mpPayment.date_approved || new Date().toISOString(),
          raw_response_json: mpPayment
        })
        .eq("mercado_pago_payment_id", resourceId.toString())
        .select()
        .maybeSingle();

      if (!updatedPayment && mpExtRef) {
        console.log("Busca secundária por external_reference...");
        const { data: foundByRef } = await supabase
          .from("payments")
          .update({
            status: mpStatus,
            status_detail: mpPayment.status_detail,
            paid_at: mpPayment.date_approved || new Date().toISOString(),
            mercado_pago_payment_id: resourceId.toString(),
            raw_response_json: mpPayment
          })
          .eq("external_reference", mpExtRef)
          .select()
          .maybeSingle();
        updatedPayment = foundByRef;
      }

      let tenantId = updatedPayment?.tenant_id;
      let planId = updatedPayment?.plan_id;

      // 4. CURA AUTOMÁTICA: Se ainda assim não achou, recria do zero
      if (!tenantId || !planId) {
        if (mpExtRef && mpExtRef.includes('|')) {
          const parts = mpExtRef.split('|');
          tenantId = parts[0];
          planId = parts[1];
          
          if (!updatedPayment) {
            const { data: newPayment } = await supabase.from("payments").insert({
              tenant_id: tenantId, plan_id: planId, amount: mpPayment.transaction_amount,
              currency: mpPayment.currency_id || 'BRL', status: mpStatus,
              mercado_pago_payment_id: resourceId.toString(), external_reference: mpExtRef,
              paid_at: mpPayment.date_approved || new Date().toISOString()
            }).select().single();
            updatedPayment = newPayment;
          }
        }
      }

      if (!tenantId || !planId) {
        await supabase.from("integration_logs").insert({
          context: "webhook", level: "error", message: `Falha total ao identificar tenant para pagamento ${resourceId}`
        });
        if (eventRecord) await supabase.from("webhook_events").update({ processed: true, note: "No tenant" }).eq("id", eventRecord.id);
        return new Response(JSON.stringify({ error: "Context not found" }), { status: 200, headers: corsHeaders });
      }

      // 5. ATIVAÇÃO
      if (mpStatus === "approved") {
        const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).single();
        if (plan) {
          let expiresAt = new Date();
          if (plan.interval === "month") expiresAt.setMonth(expiresAt.getMonth() + (plan.interval_count || 1));
          else if (plan.interval === "year") expiresAt.setFullYear(expiresAt.getFullYear() + (plan.interval_count || 1));
          else expiresAt.setDate(expiresAt.getDate() + (plan.interval_count || 1));

          let finalSubId = updatedPayment?.subscription_id;

          if (finalSubId) {
            await supabase.from("subscriptions").update({
              status: "active", expires_at: expiresAt.toISOString(), external_reference: resourceId.toString()
            }).eq("id", finalSubId);
          } else {
            const { data: newSub } = await supabase.from("subscriptions").insert({
              tenant_id: tenantId, plan_id: planId, status: "active",
              started_at: mpPayment.date_approved || new Date().toISOString(),
              expires_at: expiresAt.toISOString(), external_reference: resourceId.toString()
            }).select().single();
            if (newSub && updatedPayment) {
              finalSubId = newSub.id;
              await supabase.from("payments").update({ subscription_id: finalSubId }).eq("id", updatedPayment.id);
            }
          }
          
          await supabase.from("integration_logs").insert({
            context: "webhook", level: "info", message: `Sucesso: Assinatura ativada para tenant ${tenantId}`,
            metadata_json: { payment_id: resourceId, cured: !updatedPayment?.id }
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
