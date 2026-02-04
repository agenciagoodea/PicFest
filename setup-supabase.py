#!/usr/bin/env node

/**
 * Script Python para aplicar o schema do Supabase
 * Execute com: python setup-supabase.py
 */

import requests
import json

# Configuração
SUPABASE_URL = "https://jqeymlzaaswqqowodhte.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZXltbHphYXN3cXFvd29kaHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE0NzA0OSwiZXhwIjoyMDg1NzIzMDQ5fQ.GgDpce-52W3l6msUQPlBn7co6ky_96-3-jHPkRnIblo"

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

def execute_sql(sql):
    """Executa SQL via REST API do Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    payload = {"sql_query": sql}
    
    response = requests.post(url, headers=headers, json=payload)
    return response

def main():
    print("🚀 Iniciando configuração do Supabase...\n")
    
    # Ler arquivo SQL
    print("📋 Lendo arquivo de schema...")
    with open('supabase_schema.sql', 'r', encoding='utf-8') as f:
        schema = f.read()
    
    # Dividir em comandos
    commands = [cmd.strip() for cmd in schema.split(';') if cmd.strip() and not cmd.strip().startswith('--')]
    
    print(f"📊 Encontrados {len(commands)} comandos SQL\n")
    print("=" * 60)
    
    success_count = 0
    error_count = 0
    
    for i, cmd in enumerate(commands, 1):
        cmd_preview = cmd[:50].replace('\n', ' ')
        print(f"⏳ [{i}/{len(commands)}] {cmd_preview}...")
        
        result = execute_sql(cmd + ';')
        
        if result.status_code == 200:
            print(f"✅ Sucesso!\n")
            success_count += 1
        else:
            print(f"❌ Erro: {result.text}\n")
            error_count += 1
    
    print("=" * 60)
    print(f"\n📊 Resumo:")
    print(f"   ✅ Sucesso: {success_count}")
    print(f"   ❌ Erros: {error_count}")
    print("\n🎉 Configuração concluída!")

if __name__ == "__main__":
    main()
