/**
 * Script para aplicar o schema do banco de dados no Supabase
 * Execute com: node setup-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = 'https://jqeymlzaaswqqowodhte.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZXltbHphYXN3cXFvd29kaHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE0NzA0OSwiZXhwIjoyMDg1NzIzMDQ5fQ.GgDpce-52W3l6msUQPlBn7co6ky_96-3-jHPkRnIblo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🚀 Iniciando configuração do Supabase...\n');

// Função para executar SQL
async function executeSql(sql, description) {
    console.log(`⏳ ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) throw error;
        console.log(`✅ ${description} - Concluído!\n`);
        return { success: true, data };
    } catch (error) {
        console.error(`❌ ${description} - Erro:`, error.message);
        return { success: false, error };
    }
}

// Função principal
async function setupDatabase() {
    console.log('📋 Lendo arquivo de schema...\n');

    const schemaPath = path.join(__dirname, 'supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Dividir o schema em comandos individuais
    const commands = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📊 Encontrados ${commands.length} comandos SQL para executar\n`);
    console.log('='.repeat(60));

    let successCount = 0;
    let errorCount = 0;

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const cmdPreview = cmd.substring(0, 50).replace(/\s+/g, ' ');

        const result = await executeSql(cmd + ';', `[${i + 1}/${commands.length}] ${cmdPreview}...`);

        if (result.success) {
            successCount++;
        } else {
            errorCount++;
        }
    }

    console.log('='.repeat(60));
    console.log('\n📊 Resumo da Execução:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);

    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...\n');

    const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')
        .order('table_name');

    if (!tablesError && tables) {
        console.log('✅ Tabelas criadas:');
        tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    console.log('\n🎉 Configuração concluída!');
}

// Executar
setupDatabase().catch(console.error);
