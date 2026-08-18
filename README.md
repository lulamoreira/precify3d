# Precify3D

Crie um app de precificação para impressão 3D chamado "Precify3D" como um único arquivo HTML (React via CDN + Babel standalone + Tailwind CDN). Sem build, sem servidor — abre direto no navegador.

Design: tema dark (background #07071a, cards #111128, destaque laranja #f97316). Visual moderno com bordas suaves, animação fadeIn nos resultados e scrollbar customizada.

3 abas no header:

1. Calculadora — dois cards lado a lado (responsivos):

Card esquerdo (formulário): campos Cliente, Peça/Projeto, Material (dropdown), Peso (g), Tempo (h + min separados), Taxa de falha (%), Margem de lucro (%), Desconto (%), Embalagem (R$), seção de Marketplace de Venda, campo Taxa da plataforma (%), Observações (textarea), botão "⚡ Calcular Preço" e botão "Limpar formulário"

Card direito (resultado): aparece após calcular — breakdown de custos (material com peso efetivo, energia elétrica, mão de obra, desgaste da máquina, embalagem), separador, custo total, margem, taxa do marketplace, desconto, caixa laranja grande com "Preço Final de Venda", 3 mini-stats (Custo/g, Preço/g, Lucro líquido), botão "💾 Salvar orçamento"

Cálculo:

pesoEfetivo = peso × (1 + falha/100)

custoMaterial = (pesoEfetivo/1000) × preçoKg

custoEnergia = (watts/1000) × horas × preçoKwh

custoMaoDeObra = horas × valorHora

custoMaquina = horas × custoFixoHora

subtotal = soma de todos os custos + embalagem

margem = subtotal × margem%/100

taxaPlataforma = (subtotal + margem) × taxa%/100

desconto = (subtotal + margem + taxaPlataforma) × desconto%/100

preçoFinal = subtotal + margem + taxaPlataforma - desconto

lucro = margem - desconto

Seção Marketplace de Venda (dentro do formulário):

3 botões: "🏪 Loja própria / Outro", "🛒 Mercado Livre" (amarelo #ffe600 quando ativo), "🛍️ Shopee" (vermelho #ee4d2d quando ativo)

Ao selecionar ML: aparece escolha Clássico (12%) ou Premium (16%) com descrições

Ao selecionar Shopee: aparece Padrão (14%) ou Com Shopee Ads (16%)

Selecionar plano preenche automaticamente o campo "Taxa da plataforma"

Mostra descrição do plano + link "Verificar taxas oficiais ↗" para a página oficial

Campo de taxa permite ajuste manual mesmo após seleção automática

No resultado, a linha da taxa mostra o ícone + nome do marketplace selecionado

2. Configurações — cards separados por seção:

Energia elétrica: custo kWh (R$), potência da impressora (W)

Mão de obra & máquina: custo/hora mão de obra (R/h),desgastedamaˊquina(R/h),desgastedamaˊquina(R/h)

Padrões: margem padrão (%), falha padrão (%), embalagem padrão (R$), taxa de plataforma padrão (%)

Materiais: lista com ponto colorido, nome, preço/kg, botões editar ✏️ e excluir 🗑️ — edição inline; formulário para adicionar novo material (nome + preço/kg + botão "+ Adicionar")

Nota de auto-save laranja no rodapé

Materiais padrão: PLA 80, PLA+ 95, ABS 90, PETG 100, TPU 130, PLA Silk 110, Resina Std 150, Resina ABS-Like 180 (todos em R$/kg)

3. Histórico — lista de orçamentos salvos:

Header com título, badge com contagem, campo de busca, botão "📊 Exportar CSV"

4 cards de resumo: Total em vendas, Total de lucro, Ticket médio, Qtd orçamentos

Cada item: ícone colorido do material, cliente/peça, data/hora/material/peso/tempo, valores (Custo, Lucro, Preço Final em laranja), botão Excluir

Exporta CSV com: Data, Hora, Cliente, Peça, Material, Peso, Tempo, Custo, Margem, Plataforma, Desconto, Preço Final, Lucro

Persistência localStorage: chaves precify3d_cfg e precify3d_history. Configurações e histórico salvos automaticamente.

Validação: peso e tempo são obrigatórios — erro inline em vermelho se vazios ao calcular.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://precify3d.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7a9a0db2-3ead-4d24-9d1a-7a80f082a9d2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
