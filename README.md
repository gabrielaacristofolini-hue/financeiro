# Meus Gastos

Uma página simples, publicada no **GitHub Pages**, que mostra para onde foi o dinheiro do mês. É só visualização: os dados são processados no chat com o Claude e gravados em `dados/transacoes.js`.

## O que a página mostra

- **Resumo dos gastos**: total, fixos, variáveis, maior categoria e quanto está em "Outros".
- **Pizza completa**: todas as categorias de gasto, com valor e porcentagem. Clique numa fatia para filtrar os lançamentos.
- **Gastos por categoria**: onde foi gasto, se é fixo ou variável, quantidade, valor e %.
- **Lançamentos**: cada gasto, com as observações escritas no app do banco.

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
