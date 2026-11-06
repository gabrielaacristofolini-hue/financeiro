# Relatório de Despesas

Uma página única, publicada no **GitHub Pages**, que mostra para onde foi o dinheiro do mês. É só visualização: os dados são processados no chat com o Claude e gravados em `dados/transacoes.js`.

## O que a página mostra

- **Capa**: total gasto no mês, quantidade de gastos, número de categorias, quanto do que entrou foi gasto e o maior gasto.
- **01 · Para onde foi**: gastos por categoria. Clique numa barra para filtrar.
- **02 · Fixo x variável**: o que se repete todo mês e o que varia.
- **03 · Sem destino**: o que está em "Outros".
- **04 · Onde mais gastei**: por estabelecimento ou pessoa.
- **05 · Dia a dia**: quanto saiu em cada dia.
- **06 · Lançamentos**: todos os gastos, com as observações escritas no app do banco.

## Arquivos

```
index.html            a página
css/estilo.css        visual (amarelo, preto e branco)
js/app.js             cálculos e gráficos
dados/transacoes.js   banco de dados: transações limpas e categorizadas
privado/              extratos originais do banco (não vão para o GitHub)
```

## Como os dados são atualizados

1. O Gabriel escreve no app do banco uma observação em cada transação, dizendo o que ela foi, e manda o extrato no chat.
2. O Claude:
   - lê as observações;
   - liga transações relacionadas, como um troco que volta ou um dinheiro usado junto com um Pix;
   - define a categoria de cada uma;
   - remove CPF, agência e conta;
   - confere as somas com os totais do extrato.
3. As transações vão para `dados/transacoes.js` e são publicadas na `main`.

## Regras de cálculo

- **Despesas**: tudo que não é receita nem movimentação neutra.
- **Troco ou reembolso**: um valor que volta abate o gasto da mesma categoria. Não conta como renda.
- **Receitas**: *Salário e renda* e *Recebimentos*. Aparecem só como referência, em "do que entrou".
- **Não contam**: *Investimentos* e *Transferência entre contas*.
- **Outros**: gasto sem destino conhecido.
- **Fixas**: Moradia, Contas da casa, Assinaturas, Educação e Academia. As demais categorias são variáveis.
