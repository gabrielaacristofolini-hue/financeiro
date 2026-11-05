# Minhas Finanças

Painel pessoal de gastos que roda direto no **GitHub Pages**, sem servidor e sem build: só HTML, CSS e JavaScript.

O painel mostra:

- receitas, despesas, saldo e valor investido;
- receitas x despesas mês a mês;
- quanto da renda foi gasto;
- divisão dos gastos por categoria;
- despesas fixas x variáveis;
- onde você mais gastou (por estabelecimento ou pessoa);
- de onde veio a receita;
- todas as transações, com busca e troca de categoria.

## Publicar no GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em *Build and deployment*, escolha **Source: Deploy from a branch**.
3. Selecione a branch **main** e a pasta **/ (root)**, e clique em **Save**.
4. Em 1 ou 2 minutos o site fica disponível em `https://gabrielaacristofolini-hue.github.io/financeiro/`.

## Privacidade: por que os dados vão cifrados

O repositório é **público**: qualquer pessoa consegue ler os arquivos dele. Um extrato bancário tem nomes, CPFs parciais e números de conta, seus e de terceiros. Por isso:

- extratos (`.csv`, `.ofx`, `.pdf`) e a pasta `privado/` estão no `.gitignore` e **nunca** são enviados;
- o site publicado lê apenas `dados/financas.cifrado.json`, um arquivo cifrado com **AES-256-GCM**, cuja chave é derivada da sua senha com PBKDF2 (600 mil iterações);
- a senha nunca sai do seu navegador. Sem ela o arquivo é ilegível, e também **não há como recuperá-la**.

## Como atualizar com um extrato novo

1. Abra o site (publicado ou o `index.html` local) e clique em **Importar extrato**. São aceitos CSV e OFX do Nubank, CSV de outros bancos com colunas Data/Valor/Descrição e o backup JSON do próprio site. Você também pode arrastar o arquivo para a página.
2. Confira as categorias. Para corrigir uma, troque no seletor da tabela: a correção vale para todas as transações do mesmo estabelecimento ou pessoa.
3. Abra o menu **⋯ → Exportar dados cifrados**, escolha a senha e salve o arquivo `financas.cifrado.json`.
4. Envie esse arquivo para a pasta `dados/` do repositório, substituindo o anterior. Pode ser pelo próprio site do GitHub: *Add file → Upload files*.

Importar um extrato que já foi importado não duplica nada: as transações são identificadas pelo código do banco.

## Visualizar localmente

Com os extratos na pasta `privado/` (que só existe no seu computador), basta abrir o `index.html` no navegador: o arquivo `privado/dados.js` carrega seus dados sem passar pela internet.

## Estrutura

```
index.html          página do painel
css/estilo.css      visual (tema escuro verde / limão)
js/app.js           carregamento, cálculos e gráficos (Chart.js)
js/importar.js      leitura de CSV / OFX / JSON
js/categorias.js    regras de categorização automática
js/cripto.js        cifrar e decifrar com senha (Web Crypto)
js/exemplo.js       dados fictícios de demonstração
dados/              apenas financas.cifrado.json (publicado)
privado/            seus extratos em texto aberto (NÃO publicado)
```

## Regras de cálculo

- **Despesas**: saídas em todas as categorias de gasto. Estornos e reembolsos reduzem a categoria correspondente.
- **Receitas**: entradas em *Salário e renda* e *Recebimentos*.
- **Não contam** em nenhum dos dois: *Investimentos* (aplicações e resgates) e *Transferência entre contas* (dinheiro que só mudou de conta).
- **Fatura do cartão**: o pagamento da fatura conta como gasto enquanto o extrato do cartão não é importado. Depois que ele é importado, cada compra do cartão é contada individualmente e o pagamento da fatura passa a ser neutro, para nada ser contado duas vezes.
- **Despesas fixas**: Moradia, Contas da casa, Assinaturas, Educação e Academia. As demais são variáveis.
