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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Validar Usuário Solicitante (Deve ser Admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: { user: caller }, error: authError } = await (createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )).auth.getUser();

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Verificar se o solicitante é Admin no banco
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Apenas admins podem excluir usuários" }), { status: 403, headers: corsHeaders });
    }

    // 2. Extrair ID do usuário a ser excluído
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), { status: 400, headers: corsHeaders });
    }

    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Você não pode excluir sua própria conta" }), { status: 400, headers: corsHeaders });
    }

    console.log(`Iniciando LIMPEZA ROBUSTA para o usuário: ${userId}`);

    // 3. LIMPEZA DE DEPENDÊNCIAS (Para evitar erros de Foreign Key)
    
    // a) Buscar eventos do usuário
    const { data: userEvents } = await supabaseAdmin
      .from("eventos")
      .select("id")
      .eq("organizador_id", userId);
    
    const eventIds = userEvents?.map(e => e.id) || [];

    if (eventIds.length > 0) {
      console.log(`Limpando dependências de ${eventIds.length} eventos...`);
      // Limpar mídias dos eventos
      await supabaseAdmin.from("midias").delete().in("evento_id", eventIds);
      // Limpar depoimentos dos eventos
      await supabaseAdmin.from("depoimentos").delete().in("evento_id", eventIds);
    }

    // b) Limpar Eventos
    await supabaseAdmin.from("eventos").delete().eq("organizador_id", userId);

    // c) Limpar Assinaturas e Pagamentos (usando tenant_id conforme padrão do Webhook)
    await supabaseAdmin.from("payments").delete().eq("tenant_id", userId);
    await supabaseAdmin.from("subscriptions").delete().eq("tenant_id", userId);

    // d) Limpar Profile
    await supabaseAdmin.from("profiles").delete().eq("id", userId);


    // 4. Excluir do Auth (Final)
    console.log(`Excluindo conta de autenticação para: ${userId}`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      // Se o erro for User Not Found, tudo bem, o importante é que limpamos o banco
      if (deleteError.message.includes("User not found")) {
        console.log("Usuário já não existia no Auth. Finalizando com sucesso.");
      } else {
        console.error("Erro ao excluir do Auth:", deleteError);
        return new Response(JSON.stringify({ 
          error: "Erro ao excluir conta de autenticação", 
          details: deleteError.message 
        }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Usuário e todos os seus dados foram excluídos com sucesso" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Critical error during user deletion:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
