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
    console.log("Auth Header present:", !!authHeader);

    if (!authHeader) {
      console.error("Erro: Sem cabeçalho Authorization");
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
      console.error("Erro de autenticação Supabase:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    console.log("Payload recebido:", JSON.stringify(body));
    const { action, purchaseType = 'plan', planId, addonId, eventoId, paymentMethod, cardToken, email, installments, payer, deviceId } = body;

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

    // 2. Buscar detalhes do item (Plano ou Addon)
    let itemDetails: any = null;
    let amount = 0;
    
    if (purchaseType === 'addon') {
      if (!addonId || !eventoId) throw new Error("AddonId e EventoId são obrigatórios para pacote adicional.");
      const { data: addon, error: addonError } = await supabaseAdmin
        .from("plan_addons_catalog")
        .select("*")
        .eq("id", addonId)
        .single();
      if (addonError || !addon) throw new Error("Adicional não encontrado");
      itemDetails = addon;
      amount = Number(addon.price);
    } else {
      const { data: plan, error: planError } = await supabaseAdmin
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();
      if (planError || !plan) throw new Error("Plano não encontrado");
      itemDetails = plan;
      amount = Number(plan.price);
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

    // Diferenciar external_reference
    const externalReference = purchaseType === 'addon' 
      ? `addon|${tenantId}|${eventoId}|${addonId}|${payerEmail}`
      : `plan|${tenantId}|${planId}|${payerEmail}`;

    // MED-01: Idempotency Key única
    const idempotencyKey = purchaseType === 'addon'
      ? `${tenantId}-addon-${addonId}-${Date.now()}`
      : `${tenantId}-plan-${planId}-${Date.now()}`;

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
      transaction_amount: amount,
      description: purchaseType === 'addon' ? `PicFest - Pacote Adicional ${itemDetails.name}` : `PicFest - Assinatura Plano ${itemDetails.name}`,
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
            id: purchaseType === 'addon' ? addonId : planId,
            title: purchaseType === 'addon' ? `Adicional PicFest - ${itemDetails.name}` : `Assinatura PicFest - ${itemDetails.name}`,
            description: itemDetails.description || (purchaseType === 'addon' ? `Pacote extra para o evento` : `Plano base`),
            category_id: "services",
            quantity: 1,
            unit_price: amount
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
        plan_id: purchaseType === 'plan' ? planId : undefined,
        addon_id: purchaseType === 'addon' ? addonId : undefined,
        evento_id: eventoId,
        purchase_type: purchaseType,
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
        plan_id: purchaseType === 'plan' ? planId : null,
        addon_id: purchaseType === 'addon' ? addonId : null,
        evento_id: eventoId || null,
        purchase_type: purchaseType,
        mercado_pago_payment_id: mpData.id.toString(),
        external_reference: externalReference,
        payment_method: paymentMethod,
        payment_type: mpData.payment_type_id,
        amount: amount,
        currency: itemDetails.currency || "BRL",
        status: mpData.status,
        status_detail: mpData.status_detail,
        is_test: mpEnvironment === "sandbox",
        payer_email: email || user.email,
        pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_copy_paste: mpData.point_of_interaction?.transaction_data?.qr_code,
        raw_response_json: mpData
      })
      .select()
      .single();

    if (dbError) {
      console.error("Erro ao salvar pagamento no banco:", JSON.stringify(dbError));
    } else {
      console.log("Pagamento salvo com sucesso:", savedPayment?.id);
    }

    // 7. Se pagamento JÁ aprovado (cartão aprovado de vez), ativar imediatamente
    if (mpData.status === "approved") {
      console.log(`Pagamento aprovado imediatamente [${purchaseType}]...`);

      if (purchaseType === 'addon') {
        // Criar registro na event_plan_addons
        const { error: subError } = await supabaseAdmin
          .from("event_plan_addons")
          .insert({
            tenant_id: tenantId,
            evento_id: eventoId,
            addon_id: addonId,
            payment_id: savedPayment?.id,
            name_snapshot: itemDetails.name,
            type_snapshot: itemDetails.addon_type,
            price_snapshot: itemDetails.price,
            extra_photos_snapshot: itemDetails.extra_photos,
            extra_videos_snapshot: itemDetails.extra_videos,
            status: "active"
          });
        if (subError) console.error("Erro ao registrar addon:", JSON.stringify(subError));
        else console.log(`Addon liberado para evento ${eventoId}`);

      } else {
        // Fluxo de Plano (Renovação ou nova Assinatura)
        let expiresAt = new Date();
        if (itemDetails.interval === "month") expiresAt.setMonth(expiresAt.getMonth() + (itemDetails.interval_count || 1));
        else if (itemDetails.interval === "year") expiresAt.setFullYear(expiresAt.getFullYear() + (itemDetails.interval_count || 1));
        else if (itemDetails.interval === "day") expiresAt.setDate(expiresAt.getDate() + (itemDetails.interval_count || 1));
        else expiresAt.setFullYear(expiresAt.getFullYear() + 100);

        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (existingSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan_id: planId,
              status: "active",
              expires_at: expiresAt.toISOString(),
              renewal_date: expiresAt.toISOString(),
              external_reference: externalReference
            })
            .eq("id", existingSub.id);
        } else {
          await supabaseAdmin
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
        }
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
