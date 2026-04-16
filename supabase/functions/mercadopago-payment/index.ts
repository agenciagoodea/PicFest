import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS restrito ao domínio oficial (CRIT-02 / HIGH-03)
const allowedOrigins = [
  "https://picfest.vercel.app",
  "https://picfest.com.br",
  "http://localhost:5173",
];

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin ?? "") ? (origin ?? "") : allowedOrigins[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});


serve(async (req) => {
  // Handle CORS
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Cliente com service_role para operações de banco
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Validar Usuário - criar cliente secundário com o JWT do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: No token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Usar o JWT diretamente: criar client de usuário para validar sessão
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    const { action, planId, paymentMethod, cardToken, email, installments, payer, deviceId } = body;

    // ... (restante do código até o payload MP) ...


    // AÇÃO ESPECIAL: Testar conexão (Bypass CORS)
    if (action === "test-connection") {
      const tokenToTest = body.accessToken;
      if (!tokenToTest) {
        return new Response(JSON.stringify({ success: false, error: "AccessToken não fornecido." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        console.log("Testando token no endpoint /users/me...");
        const testRes = await fetch("https://api.mercadopago.com/users/me", {
          headers: { "Authorization": `Bearer ${tokenToTest}` }
        });

        console.log("Resposta MP Status:", testRes.status);
        const testData = await testRes.json();
        
        if (!testRes.ok) {
          console.error("Erro MP Test:", testData);
          return new Response(JSON.stringify({ 
            success: false, 
            error: testData.message || `Erro ${testRes.status}: Token inválido ou sem permissão` 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          nickname: testData.nickname || testData.first_name || 'Conta MP',
          id: testData.id,
          email: testData.email,
          site_id: testData.site_id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Erro técnico no teste:", err);
        return new Response(JSON.stringify({ success: false, error: "Erro de rede ou timeout ao validar token." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Buscar Access Token do banco de dados (salvo nas configs do admin)
    const { data: configRow } = await supabaseAdmin
      .from("configuracao_geral")
      .select("conteudo")
      .eq("id", "mercadopago_config")
      .maybeSingle();

    const mpAccessToken = configRow?.conteudo?.mercadopago?.accessToken || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!mpAccessToken) {
      throw new Error("Mercado Pago Access Token não configurado. Configure em Parâmetros API.");
    }

    // 2. Buscar detalhes do plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plano não encontrado");
    }

    // 3. Buscar tenant associado ao usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, nome")
      .eq("id", user.id)
      .single();

    let tenantId = profile?.tenant_id;

    // Se o usuário não tem tenant, cria um na hora
    if (!tenantId) {
      const { data: newTenant, error: tenantCreateError } = await supabaseAdmin
        .from("tenants")
        .insert({
           name: `Organização de ${profile?.nome || 'Usuário'}`,
           owner_id: user.id
        })
        .select()
        .single();
        
      if (tenantCreateError || !newTenant) {
        throw new Error("Falha ao configurar ecossistema da organização.");
      }
      
      tenantId = newTenant.id;
      
      // Atualizar o profile com o novo tenant
      await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenantId })
        .eq("id", user.id);
    }

    // 4. Preparar payload para o Mercado Pago
    // mpAccessToken já foi obtido do banco acima
    const mpEnvironment = configRow?.conteudo?.mercadopago?.environment || Deno.env.get("MERCADO_PAGO_ENVIRONMENT") || "sandbox";
    const webhookUrl = configRow?.conteudo?.mercadopago?.webhookUrl || Deno.env.get("MERCADO_PAGO_WEBHOOK_URL");
    const payerEmail = email || user.email;

    const externalReference = `${tenantId}|${planId}|${payerEmail}`;
    // MED-01: Idempotency Key única por tentativa para evitar bloqueio em renovações
    const idempotencyKey = `${tenantId}-${planId}-${Date.now()}`;

    // MED-03: Validar formato de CPF antes de enviar ao Mercado Pago
    if (payer?.identification?.number) {
      const cpfClean = payer.identification.number.replace(/\D/g, '');
      if (cpfClean.length !== 11 && cpfClean.length !== 14) {
        return new Response(JSON.stringify({ error: "CPF/CNPJ inválido. Informe apenas os números (11 ou 14 dígitos)." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // Sanitizar o campo
      payer.identification.number = cpfClean;
    }
    
    let mpPayload: any = {
      transaction_amount: Number(plan.price),
      description: `PicFest - Assinatura Plano ${plan.name}`,
      payment_method_id: paymentMethod,
      payer: {
        email: payerEmail,
        identification: payer?.identification,
        first_name: payer?.first_name,
        last_name: payer?.last_name,
      },
      external_reference: externalReference,
      notification_url: webhookUrl,
      additional_info: {
        items: [
          {
            id: planId,
            title: `Assinatura PicFest - Plano ${plan.name}`,
            description: plan.description || `Assinatura do serviço PicFest - Plano ${plan.name}`,
            category_id: "services",
            quantity: 1,
            unit_price: Number(plan.price)
          }
        ],
        payer: {
          first_name: payer?.first_name || profile?.nome?.split(' ')[0] || 'Cliente',
          last_name: payer?.last_name || profile?.nome?.split(' ').slice(1).join(' ') || 'PicFest',
          registration_date: new Date().toISOString()
        }
      },
      metadata: {
        tenant_id: tenantId,
        plan_id: planId,
        user_id: user.id,
        environment: mpEnvironment,
        device_id: deviceId
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
        "X-Idempotency-Key": idempotencyKey,
        "X-Meli-Session-Id": deviceId || "", // Identificador do dispositivo para conformidade
        "X-MercadoPago-SDK-Platform": "Deno/EdgeFunctions", // Atribui pontos para uso de SDK
        "X-Product-Id": "BC32A7RU643001OIAD40", // ID de Produto para facilitar identificação de SDK
        "User-Agent": "PicFest-SaaS/1.0"
      },

      body: JSON.stringify({
        ...mpPayload,
        binary_mode: true, // Aprovação imediata (Exigido para Experiência de Compra)
        statement_descriptor: "PICFEST" // Nome na fatura do cliente
      }),
    });


    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro Mercado Pago:", mpData);
      throw new Error(mpData.message || "Erro ao processar pagamento no Mercado Pago");
    }

    // 6. Registrar pagamento no banco
    const { data: savedPayment, error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        mercado_pago_payment_id: mpData.id.toString(),
        external_reference: externalReference,
        payment_method: paymentMethod,
        payment_type: mpData.payment_type_id,
        amount: Number(plan.price),
        currency: plan.currency || "BRL",
        status: mpData.status,
        status_detail: mpData.status_detail,
        is_test: mpEnvironment === "sandbox",
        payer_email: email || user.email,
        pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code_base64, // HIGH-04: base64 da imagem do QR Code
        pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_copy_paste: mpData.point_of_interaction?.transaction_data?.qr_code, // Texto copia-cola
        raw_response_json: mpData
      })
      .select()
      .single();

    if (dbError) {
      console.error("Erro ao salvar pagamento no banco:", JSON.stringify(dbError));
    } else {
      console.log("Pagamento salvo com sucesso:", savedPayment?.id);
    }

    // 7. Se pagamento JÁ aprovado (cartão aprovado de vez), ativar assinatura imediatamente
    // Não esperar pelo webhook — mais confiável para ambientes de produção/sandbox
    if (mpData.status === "approved") {
      console.log("Pagamento aprovado imediatamente, ativando assinatura...");

      let expiresAt = new Date();
      if (plan.interval === "month") expiresAt.setMonth(expiresAt.getMonth() + (plan.interval_count || 1));
      else if (plan.interval === "year") expiresAt.setFullYear(expiresAt.getFullYear() + (plan.interval_count || 1));
      else if (plan.interval === "day") expiresAt.setDate(expiresAt.getDate() + (plan.interval_count || 1));
      else expiresAt.setFullYear(expiresAt.getFullYear() + 100);

      // Verificar se já existe assinatura ativa para este tenant
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existingSub) {
        // Renovar assinatura existente
        const { error: subError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_id: planId,
            status: "active",
            expires_at: expiresAt.toISOString(),
            renewal_date: expiresAt.toISOString(),
            external_reference: externalReference
          })
          .eq("id", existingSub.id);
        if (subError) console.error("Erro ao renovar assinatura:", JSON.stringify(subError));
        else console.log("Assinatura renovada para tenant:", tenantId);
      } else {
        // Criar nova assinatura
        const { error: subError } = await supabaseAdmin
          .from("subscriptions")
          .insert({
            tenant_id: tenantId,
            plan_id: planId,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            renewal_date: expiresAt.toISOString(),
            external_reference: externalReference
          });
        if (subError) console.error("Erro ao criar assinatura:", JSON.stringify(subError));
        else console.log("Nova assinatura criada para tenant:", tenantId);
      }
    }

    return new Response(JSON.stringify({
      ...mpData, // Manter o objeto original
      paymentId: mpData.id,
      status: mpData.status,
      point_of_interaction: mpData.point_of_interaction,
      qrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCode: mpData.point_of_interaction?.transaction_data?.qr_code,
      copyPaste: mpData.point_of_interaction?.transaction_data?.qr_code,
      expiresAt: mpData.date_of_expiration,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
    });
  }
});
