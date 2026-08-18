# Plano de Implementação: Modo Lote e Refinamento do Motor de Cálculo V2

Este plano detalha a correção de bugs fundamentais no motor de cálculo e a introdução da funcionalidade de produção em lote para o Precify3D.

## Parte 0: Correções na Base

### 0.1 Desconto e Gross-up
- Corrigir a fórmula de Gross-up em `src/lib/pricing-utils.ts`.
- O desconto será aplicado sobre o preço de tabela e removido do divisor para evitar que o preço aumente ao dar desconto.
- Adicionar validação para o divisor (mínimo 5%).

### 0.2 Fator de Falha
- Aplicar o fator de falha também aos custos de energia e máquina, não apenas ao material.
- Manter o custo de pós-processamento sem fator de falha (apenas peças boas).

### 0.3 Estimativa de Tempo
- Atualizar `estimateTimeHours` em `src/lib/stl-utils.ts` para considerar a altura (Z) e o número de camadas.
- Adicionar `layerCount` como utilitário exportado.
- Atualizar a chamada na calculadora para o novo formato de objeto.

### 0.4 Estimativa de Peso e Suporte
- Implementar clamp no volume da casca (shell) em `estimateWeightV2` para evitar pesos irreais em peças finas.
- Separar o peso do suporte (`pesoSuporteG`) do peso da peça.

## Parte A: Banco de Dados (Modo Lote)

- Adicionar colunas de configuração de mesa em `user_settings`.
- Adicionar colunas de rastreamento de lote em `quotes` e `quote_items`.

## Parte B: Lógica de Lote (`src/lib/batch-utils.ts`)

1. **Capacidade da Mesa**: Calcular quantas peças cabem considerando margens e gaps (incluindo rotação 90°).
2. **Tempo de Lote**: Lógica diferenciada para modos Simultâneo (economia de camadas) e Sequencial.
3. **Risco de Lote**: Cálculo de risco composto para o modo simultâneo (se uma falha derruba a mesa).
4. **Cálculo Consolidado**: Calcular custos por mesa (cheias e resto) e derivar o preço unitário com base na economia real.

## Parte C: Interface da Calculadora

- Adicionar controles de modo lote (switch, modo de impressão, peças por mesa).
- Exibir card de "Análise de Lote" com economia, tempo total e alertas de risco (cores dinâmicas).
- Gráfico de curva de custo (Recharts) para identificar o `melhorN`.
- Tabela de preços por quantidade para exportação rápida.

## Parte D: Configurações e Persistência

- Nova seção "Minha Impressora / Mesa" nas configurações.
- Presets de impressoras populares (Bambu, Ender, Prusa).
- Salvar e carregar dados de lote em orçamentos e itens.
- Garantir que informações internas (custo, risco) não apareçam no PDF/HTML público.

## Detalhes Técnicos

- **Tecnologias**: React 19, TanStack Start, Supabase, Tailwind v4, Recharts.
- **Segurança**: RLS mantido; dados sensíveis omitidos em links públicos via RPC.
- **Robustez**: Validações para quantidades negativas ou peças que excedem o tamanho da mesa.
