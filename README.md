# Minhas Finanças

Painel pessoal de gastos publicado no **GitHub Pages**. É só visualização: os dados ficam no próprio repositório e são atualizados pelo Claude a partir dos extratos enviados no chat.

## O que o painel mostra

- receitas, despesas, saldo e valor investido;
- receitas x despesas mês a mês (clique num mês para filtrar);
- porcentagem da renda gasta;
- divisão dos gastos por categoria (clique numa categoria para ver as transações);
- despesas fixas x variáveis;
- onde mais gastei, por estabelecimento ou pessoa;
- divisão da receita por origem;
- lista de transações com busca.

## Arquivos

```
index.html            página
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
