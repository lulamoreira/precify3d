# Plano de Melhoria Técnica – Precify3D (v2)

Implementação de motor de cálculo tecnicamente correto, suporte a novos formatos de arquivo (G-code, 3MF) e expansão do banco de dados para configurações avançadas.

## Parte A: Banco de Dados (Migração Aditiva)

Adicionar novas colunas às tabelas existentes sem invalidar dados históricos.

### Alterações em `user_settings`
- `tax_pct`: Imposto (MEI/Simples).
- `setup_minutes`: Tempo fixo de preparação.
- `post_processing_price_hour`: Custo da hora de pós-processamento.
- Parâmetros técnicos: `layer_height`, `nozzle_width`, `walls`, `volumetric_rate`.
- `time_calibration`: Fator de correção de tempo.
- `engine_version`: Controle de versão do motor ('v1' ou 'v2').

### Alterações em `quotes`
- Campos para persistir os novos cálculos: `quantity`, `tax_pct`, `tax_value`, `cost_support`, `cost_post`, `cost_setup`.
- Metadados do arquivo: `source`, `stl_volume_cm3`, `stl_area_cm2`, `dim_x`, `dim_y`, `dim_z`, `infill_pct`.

## Parte B: Lógica de Geometria e Estimativa (`src/lib/stl-utils.ts`)

1. **`analyzeTriangles`**: Atualizar para calcular a área de superfície total (mm²) e área projetada XY.
2. **`estimateWeightV2`**: Nova fórmula considerando casca (paredes) e preenchimento separadamente, além de estimativa de suporte baseada em overhangs.
3. **`estimateTimeHours`**: Nova estimativa baseada na taxa volumétrica (mm³/s), tempo de troca de camada e aquecimento.

## Parte C: Motor de Cálculo v2 (`src/lib/pricing-utils.ts`)

Implementar `calculatePricingV2` com a lógica de **Gross-up**:
- O cálculo de impostos e taxas de plataforma incidirá sobre o **preço de venda final**, e não apenas sobre o custo, corrigindo o erro de margem atual.
- Inclusão de custos de Setup e Pós-processamento.
- Cálculo de `margemRealPct` e `precoMinimo` (ponto de equilíbrio).

## Parte D: Suporte a G-code e 3MF

1. **G-code**: Parser via Regex para extrair peso e tempo reais dos dialetos Cura, PrusaSlicer e outros.
2. **3MF**: Utilização da biblioteca `fflate` para ler metadados de fatiamento dentro do arquivo compactado.
3. **UI**: Badges coloridos indicando a origem do dado ("Dados Reais" vs "Estimativa").

## Parte E: Interface do Usuário (UI)

1. **Configurações**: Nova aba "Impressão & Impostos" com switch para ativar o Motor v2.
2. **Calculadora**:
   - Campos para Quantidade e Pós-processamento.
   - Painel de resultados detalhado (Imposto, Taxa, Margem Real).
   - Alerta visual (card vermelho) em caso de prejuízo.
   - Ferramenta de calibração de tempo.

## Detalhes Técnicos

- **Tecnologias**: React 19, TanStack Start, Supabase, Tailwind v4, `fflate` (para 3MF).
- **Segurança**: Manutenção das políticas RLS (`auth.uid()`).
- **Compatibilidade**: Uso de defaults e colunas nullable para garantir que orçamentos antigos continuem funcionando.
- **Rollback**: O campo `engine_version` nas configurações permite ao usuário alternar entre o motor novo e o antigo se desejar.
