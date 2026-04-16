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

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
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

    // Segurança: Impedir auto-exclusão
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Você não pode excluir sua própria conta" }), { status: 400, headers: corsHeaders });
    }

    console.log(`Iniciando exclusão total do usuário: ${userId}`);

    // 3. Excluir do Auth (Isso deve disparar o cascade para o Profile se configurado, senão excluímos manual)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Erro ao excluir do Auth:", deleteError);
      
      // Tentativa de excluir pelo menos o profile se o Auth falhar/não existir
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      
      return new Response(JSON.stringify({ error: "Erro ao excluir conta de autenticação", details: deleteError.message }), { status: 500, headers: corsHeaders });
    }

    // 4. Garantir que o profile foi removido (caso não haja cascade)
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    return new Response(JSON.stringify({ success: true, message: "Usuário excluído com sucesso" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Critical error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
