# Plano de Implementação: Segurança, Créditos Diários e Stripe

Este plano visa corrigir falhas de segurança críticas, implementar um sistema de créditos diários para precificação e preparar o terreno para a integração guiada com o Stripe.

## Etapa 1: Segurança e Papéis (User Roles)
- Criar a tabela `user_roles` para separar privilégios do perfil público.
- Implementar a função `has_role` com `SECURITY DEFINER` para evitar recursão em RLS.
- Migrar usuários atuais (atribuindo `owner` ao lula1973@gmail.com).
- Trancar a tabela `profiles` com um trigger que impede a auto-promoção de papel.
- Validar o `updateProfile` com Zod para aceitar apenas campos permitidos.

## Etapa 2: Sistema de Créditos e Planos
- Criar as tabelas `plans`, `plan_price_history`, `subscriptions` e `usage_events`.
- Implementar lógica de fuso horário (São Paulo) para renovação de créditos à meia-noite.
- Criar a função `consume_pricing` no banco de dados para débito atômico de créditos.
- Gerar um "fingerprint" da peça para evitar cobrança dupla por ajustes na mesma peça em 24h.
- Integrar o bloqueio de cálculo na UI caso os créditos acabem.

## Etapa 3: Interface e Onboarding
- Adicionar contador de créditos na sidebar/header.
- Criar a rota `/planos` com cards dinâmicos baseados no banco de dados.
- Garantir que todos os usuários atuais recebam um Trial cortesia de 30 dias.

## Etapa 4: Painel Administrativo (/admin)
- Criar gestão de planos com integração automática (Stripe API) para criação de produtos/preços.
- Gerenciar usuários, cupons e visualizar métricas de conversão.

## Etapa 5: Stripe (Modo Guiado)
- Configurar o Stripe passo a passo (Test Mode primeiro).
- Implementar Webhooks como fonte única da verdade para assinaturas.

## Detalhes Técnicos
- **Banco de Dados**: Migrações via SQL para RLS, Triggers e Funções.
- **Server Functions**: Proteção com middlewares e validação rigorosa com Zod.
- **Segurança**: RLS em 100% das novas tabelas; bloqueio de escrita direta em assinaturas pelo cliente.
- **Performance**: Índices em `usage_events` para consultas rápidas de saldo.
