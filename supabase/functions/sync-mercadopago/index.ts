import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Only admins can manually sync payments");

    const { paymentId } = await req.json();
    if (!paymentId) throw new Error("paymentId is required");

    const { data: configRow } = await supabaseAdmin.from("configuracao_geral").select("conteudo").eq("id", "mercadopago_config").maybeSingle();
    const mpAccessToken = configRow?.conteudo?.mercadopago?.accessToken || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MP Access Token not configured");

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${mpAccessToken}` }
    });

    if (!mpResponse.ok) {
        throw new Error(`Erro na API do MP: ${mpResponse.status}`);
    }

    const mpPayment = await mpResponse.json();
    const mpStatus = mpPayment.status;

    const truePaidAt = mpStatus === 'approved' ? (mpPayment.date_approved || new Date().toISOString()) : null;

    let { data: updatedPayment } = await supabaseAdmin.from("payments").update({
        status: mpStatus,
        status_detail: mpPayment.status_detail,
        paid_at: truePaidAt,
        raw_response_json: mpPayment
    }).eq("mercado_pago_payment_id", paymentId.toString()).select().maybeSingle();

    if (!updatedPayment && mpPayment.external_reference) {
         let { data: foundByRef } = await supabaseAdmin.from("payments").update({
            status: mpStatus,
            status_detail: mpPayment.status_detail,
            paid_at: truePaidAt,
            mercado_pago_payment_id: paymentId.toString(),
            raw_response_json: mpPayment
        }).eq("external_reference", mpPayment.external_reference).select().maybeSingle();
        updatedPayment = foundByRef;
    }

    // Ativação da Subscription se tiver
    if (updatedPayment?.subscription_id) {
       if (mpStatus === "approved") {
          await supabaseAdmin.from("subscriptions").update({ status: "active" }).eq("id", updatedPayment.subscription_id);
       } else if (mpStatus === "rejected" || mpStatus === "cancelled" || mpStatus === "refunded") {
          await supabaseAdmin.from("subscriptions").update({ status: "cancelled" }).eq("id", updatedPayment.subscription_id);
       }
    }

    return new Response(JSON.stringify({ success: true, payment: updatedPayment }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
