# Projeto iBob — Agente de IA para Tráfego Pago

Arquivos gerados ao longo do projeto de estruturação do agente de IA
para gestão de tráfego pago da iBob Motores Elétricos.

---

## Arquivos incluídos

### 1. iBob_Agente_Trafego_Pago.docx
Blueprint completo do agente em formato Word. Contém 18 seções cobrindo:
- Sumário executivo e diagnóstico
- Arquitetura em 7 camadas + Memória de Decisão
- Mapa de decisões para Google Ads e Meta Ads
- Camada 7 — Experimentação Controlada
- Validação determinística (rule_validator)
- Testes automatizados obrigatórios
- Versionamento de prompts e thresholds
- Segurança, tokens e auditoria
- Roadmap detalhado até 31 de maio

### 2. iBob_Arquitetura_Agente.html
Drawflow interativo da arquitetura. Abre no navegador.
7 abas: Arquitetura · Validação determinística · Segurança ·
Testes e CI · Versionamento · Infraestrutura · Roadmap.
Cada bloco do diagrama tem tooltip explicativo ao passar o mouse.

### 3. iBob_Passo_a_Passo.html
Guia interativo de implementação com 18 etapas.
Inclui capa com % de progresso, checkboxes para marcar
etapas concluídas, persistência via localStorage,
prompts prontos para o Claude Code em cada etapa.

---

## Stack do projeto

- Supabase (PostgreSQL gerenciado)
- Railway (workers Python)
- Vercel (dashboard Next.js)
- Claude API (decision_engine)
- Google Ads API + Meta Marketing API
- Orbita (webhook pull mensal de margem líquida)
- GA4 + Pixel (receita)
- CRM (leads consultivos)

---

## Versão

Blueprint v3.2 · Maio 2025 · Confidencial

iBob Motores Elétricos e Automação Industrial — Caxias do Sul, RS
