import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS restrito ao domínio oficial (CRIT-02 + HIGH-03)
const allowedOrigins = [
  "https://picfest.vercel.app",
  "https://picfest.com.br",
  "http://localhost:5173", // dev local
];

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin ?? "") ? (origin ?? "") : allowedOrigins[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

// --- Verificação HMAC-SHA256 da assinatura do Mercado Pago (CRIT-01) ---
async function verifyMercadoPagoSignature(
  secret: string,
  xSignature: string | null,
  xRequestId: string | null,
  resourceId: string | number | null
): Promise<boolean> {
  if (!xSignature || !xRequestId || !resourceId) {
    console.warn("Assinatura ausente ou incompleta — bloqueando request.");
    return false;
  }

  const ts = xSignature.match(/ts=(\d+)/)?.[1];
  const v1 = xSignature.match(/v1=([a-f0-9]+)/)?.[1];

  if (!ts || !v1) return false;

  // Template conforme documentação oficial do Mercado Pago
  const signedTemplate = `id:${resourceId};request-id:${xRequestId};ts:${ts};`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(signedTemplate);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === v1;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify({ action: payload.action, type: payload.type }));

    const { action, type, data } = payload;
    const resourceId = data?.id;

    // Buscar config para obter segredo do webhook e token MP
    const { data: configRow } = await supabase
      .from("configuracao_geral")
      .select("conteudo")
      .eq("id", "mercadopago_config")
      .maybeSingle();

    const mpConfig = configRow?.conteudo?.mercadopago;
    const mpAccessToken = mpConfig?.accessToken || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const webhookSecret = mpConfig?.webhookSecret || Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    const mpEnvironment = mpConfig?.environment || Deno.env.get("MERCADO_PAGO_ENVIRONMENT") || "sandbox";

    // ============================================================
    // CRIT-01: VALIDAÇÃO HMAC (Skip apenas em sandbox sem secret configurado)
    // ============================================================
    if (webhookSecret) {
      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");

      const isValid = await verifyMercadoPagoSignature(
        webhookSecret, xSignature, xRequestId, resourceId
      );

      if (!isValid) {
        console.error("[SECURITY] Assinatura inválida — request bloqueado!");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      console.log("[SECURITY] Assinatura HMAC verificada com sucesso.");
    } else {
      console.warn("[SECURITY] ATENÇÃO: webhookSecret não configurado. Validação HMAC desativada!");
    }

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

      if (!mpAccessToken) throw new Error("Token MP não encontrado no banco");

      // Consultar status real no MP
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

      // ============================================================
      // HIGH-02: Ignorar pagamentos de TESTE em produção
      // ============================================================
      if (mpPayment.live_mode === false && mpEnvironment === "production") {
        console.warn(`[SECURITY] Pagamento ${resourceId} é de TESTE — ignorando em produção.`);
        if (eventRecord) {
          await supabase.from("webhook_events")
            .update({ processed: true, note: "Test payment ignored in production" })
            .eq("id", eventRecord.id);
        }
        return new Response(JSON.stringify({ received: true, note: "test_payment_ignored" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. BUSCA DUPLA: por ID MP, depois por external_reference
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

      // 4. CURA AUTOMÁTICA: Recria do external_reference se necessário
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
            metadata_json: { payment_id: resourceId, live_mode: mpPayment.live_mode }
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
      headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
    });
  }
});
