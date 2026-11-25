# Meus Gastos

Uma página simples, publicada no **GitHub Pages**, que mostra para onde foi o dinheiro do mês. É só visualização: os dados são processados no chat com o Claude e gravados em `dados/transacoes.js`.

## O que a página mostra

- **Destaques**: total gasto, média por dia, porcentagem de gastos fixos e quanto está em "Outros".
- **Para onde foi o dinheiro**: pizza completa com todas as categorias, ao lado da tabela de categorias com valor, % e barra de proporção. Clicar numa fatia ou numa categoria filtra a página.
- **Gastos por dia**: uma barra por dia do mês. Clicar num dia filtra os lançamentos.
- **Lançamentos**: agrupados por dia, com as observações escritas no app do banco e as ligações entre transações.

O foco é o gasto: entradas como salário não aparecem na página.

## Arquivos

```
index.html            a página
css/estilo.css        visual
js/app.js             cálculos e gráficos
dados/transacoes.js   banco de dados: transações limpas e categorizadas
privado/              extratos originais do banco (não vão para o GitHub)
```

## Como os dados são atualizados

1. O Gabriel escreve no app do banco uma observação em cada transação e manda o extrato no chat.
2. O Claude lê as observações, liga transações relacionadas, define as categorias, remove CPF, agência e conta e confere as somas com os totais do extrato.
3. As transações vão para `dados/transacoes.js` e são publicadas na `main`.

## Regras de cálculo

- **Troco ou reembolso**: um valor que volta abate o gasto da mesma categoria.
- **Não contam como gasto**: *Salário e renda*, *Recebimentos*, *Investimentos* e *Transferência entre contas*.
- **Outros**: gasto sem destino conhecido.
- **Fatura do cartão**: entra como um gasto único enquanto o extrato do cartão não for enviado.
- **Fixos**: Moradia, Contas da casa, Assinaturas, Educação e Academia. As demais categorias são variáveis.
