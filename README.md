# Minhas Finanças

Painel pessoal de gastos publicado no **GitHub Pages**. É só visualização: os dados ficam no próprio repositório e são atualizados pelo Claude a partir dos extratos enviados no chat.

## O que o painel mostra

O foco são as **despesas e suas categorias**:

- total gasto, média por mês completo, maior categoria e quanto está em "Outros";
- divisão dos gastos por categoria (clique numa categoria para ver as despesas dela);
- despesas fixas x variáveis;
- gastos por mês (clique num mês para filtrar);
- onde mais gastei, por estabelecimento ou pessoa;
- categorias mês a mês, numa tabela em que a cor mais forte indica gasto maior;
- lista de despesas com busca.

**Regra de categoria:** despesa sem destino conhecido, como um Pix para uma pessoa sem saber o motivo, vai para **Outros**. Quando souber o que foi, é só avisar no chat que a categoria é corrigida.

## Duas versões

- **Painel** (`index.html`): tema escuro com gráficos de barras e tabelas.
- **Caderno** (`caderno.html`): visual de caderno de anotações, com uma pizza colorida que mostra todos os gastos, post-its com destaques, um "tracker" de gastos por dia e um diário com as observações de cada transação.

## Arquivos

```
index.html            página (painel)
caderno.html          página (caderno)
css/caderno.css       visual do caderno
js/caderno.js         pizza, tracker e diário do caderno
css/estilo.css        visual (tema escuro verde / limão)
js/app.js             cálculos e gráficos (Chart.js)
dados/transacoes.js   banco de dados: todas as transações, já limpas e categorizadas
privado/              extratos originais do banco (não vão para o GitHub)
```

## Como os dados são atualizados

1. Você manda o extrato novo no chat.
2. O Claude limpa os dados: remove CPF, agência e conta, padroniza os nomes e define a categoria de cada transação.
3. As transações novas entram em `dados/transacoes.js`, sem repetir as que já existem, e vão para a `main`. O Pages atualiza em 1 ou 2 minutos.

## Regras de cálculo

- **Receitas**: categorias *Salário e renda* e *Recebimentos*.
- **Despesas**: todas as outras categorias. Estornos e reembolsos abatem o valor da categoria.
- **Não contam** como receita nem como despesa: *Investimentos* (aplicação e resgate) e *Transferência entre contas* (Pix entre contas próprias).
- **Fatura do cartão**: entra como despesa porque o extrato do cartão ainda não foi enviado. Quando ele for, cada compra passa a ser contada separadamente e o pagamento da fatura deixa de contar, para não somar duas vezes.
- **Despesas fixas**: Moradia, Contas da casa, Assinaturas, Educação e Academia. As demais são variáveis.
