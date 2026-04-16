import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Validar Usuário Autenticado
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { planId, paymentMethod, cardToken, email, installments, payer } = await req.json();

    // 2. Buscar detalhes do plano
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plano não encontrado");
    }

    // 3. Buscar tenant associado ao usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error("Usuário não possui organização vinculada");
    }

    const tenantId = profile.tenant_id;

    // 4. Preparar payload para o Mercado Pago
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const mpEnvironment = Deno.env.get("MERCADO_PAGO_ENVIRONMENT") || "sandbox";

    const externalReference = `TENANT_${tenantId}_PLAN_${planId}_${Date.now()}`;
    
    let mpPayload: any = {
      transaction_amount: Number(plan.price),
      description: `PicFest - Assinatura Plano ${plan.name}`,
      payment_method_id: paymentMethod, // 'pix', 'visa', etc
      payer: {
        email: email || user.email,
        identification: payer?.identification,
        first_name: payer?.first_name,
        last_name: payer?.last_name,
      },
      external_reference: externalReference,
      notification_url: Deno.env.get("MERCADO_PAGO_WEBHOOK_URL"),
      metadata: {
        tenant_id: tenantId,
        plan_id: planId,
        user_id: user.id,
        environment: mpEnvironment
      }
    };

    if (paymentMethod === "pix") {
      // Pix specific
    } else {
      // Card specific
      mpPayload.token = cardToken;
      mpPayload.installments = installments || 1;
    }

    // 5. Chamar API do Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalReference
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro Mercado Pago:", mpData);
      throw new Error(mpData.message || "Erro ao processar pagamento no Mercado Pago");
    }

    // 6. Registrar intenção/pagamento no banco
    const { data: paymentRecord, error: dbError } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        mercado_pago_payment_id: mpData.id.toString(),
        external_reference: externalReference,
        payment_method: paymentMethod,
        payment_type: mpData.payment_type_id,
        amount: Number(plan.price),
        status: mpData.status,
        status_detail: mpData.status_detail,
        is_test: mpEnvironment === "sandbox",
        payer_email: email || user.email,
        pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_copy_paste: mpData.point_of_interaction?.transaction_data?.qr_code,
        raw_response_json: mpData
      })
      .select()
      .single();

    if (dbError) {
      console.error("Erro ao salvar pagamento no banco:", dbError);
      // Não lançar erro aqui pois o pagamento já foi criado no MP
    }

    return new Response(JSON.stringify(mpData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
