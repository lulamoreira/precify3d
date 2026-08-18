# Plano de Implementação: Motor de Cálculo Lote V3

Este plano visa corrigir e aprimorar a lógica de produção em lote do Precify3D, separando os tempos fixos (aquecimento, setup) dos tempos variáveis (impressão real por peça) para garantir orçamentos precisos, especialmente para pedidos grandes e a última placa do lote.

## Alterações Sugeridas

### Banco de Dados (Aditivo)
- Adicionar `fixed_time_share` (fração fixa do tempo de placa) e `hours_per_day` (horas produtivas por dia) em `user_settings`.
- Expandir as tabelas `quotes` e `quote_items` para armazenar metadados de lote: `pieces_per_plate`, `total_pieces`, `plate_time_hours`, `single_time_hours`, `partial_plate_hours`, `total_print_hours`, `time_source` e `weight_input_mode`.

### Lógica de Cálculo (`src/lib/batch-utils.ts`)
- **Nova função `splitPlateTime`**: Decompõe o tempo total da placa em uma parte fixa (independente da quantidade de peças) e uma variável (proporcional às peças). Prioriza o cálculo exato se o tempo de uma peça isolada for fornecido.
- **Nova função `batchPlan`**: Calcula o número de placas cheias, o resto para a última placa (usando o tempo fixo para não subestimar) e as horas totais.
- **Integração no `calcBatch`**: O motor passará a usar essa decomposição para cada placa do lote, mantendo a precisão no material e energia.

### Interface da Calculadora
- **Bloco "Produção"**: Substituir o campo único de quantidade por dois campos claros: "Peças por placa" e "Total a fornecer".
- **Entrada de Tempo**: Campos separados para "Tempo da PLACA CHEIA" e "Tempo de 1 PEÇA SOZINHA" (opcional para cálculo exato).
- **Modo de Peso**: Alternador entre "Peso por PEÇA" e "Peso por PLACA" (comum em slicers).
- **Feedback Visual**: Novo card de análise de lote detalhando a divisão de placas, economia de escala e o selo "EXATO" vs "APROXIMADO".

### Prazo de Entrega
- Sugestão automática de prazo baseada no tempo total de impressão e nas horas produtivas configuradas (ex: "Só a impressão leva 44 dias. Usar 47?").
- Alerta visual se o prazo digitado for insuficiente para o tempo de máquina.

### Histórico e Documentos
- **Histórico**: Resumo compacto (ex: "1000 un · 84 placas · 878h").
- **PDF/Página Pública**: Garantir que detalhes internos (tempo de placa, custo, risco) permaneçam ocultos ao cliente final, exibindo apenas quantidade, preço e prazo.

## Detalhes Técnicos

- **Segurança**: RLS mantido. Novas colunas seguem as políticas existentes.
- **Validadores**: Bloqueio de cálculo se o tempo da placa estiver vazio; aviso de incoerência se `tempo_unidade >= tempo_placa`.
- **Compatibilidade**: Se `peças_por_placa = 1` e `total = 1`, o resultado será idêntico ao modo unitário atual (regressão zero).
- **Gráfico**: A curva de otimização só será exibida no modo "EXATO" para evitar dados enganosos.
