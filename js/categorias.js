/*
 * Categorização automática por palavras-chave.
 * As regras olham só o TIPO da transação e o NOME de quem recebeu/pagou
 * (não os dados bancários), em texto normalizado: minúsculas e sem acentos.
 * A primeira regra que casar define a categoria.
 *
 * Correções manuais feitas no site têm prioridade e valem para todas as
 * transações com o mesmo nome (ficam salvas junto com os seus dados, não aqui).
 */
(function () {
  'use strict';

  const RECEITAS = ['Salário e renda', 'Recebimentos'];
  // Movimentações que não são gasto nem renda (dinheiro que só mudou de lugar).
  const NEUTRAS = ['Investimentos', 'Transferência entre contas'];
  // "Cartão de crédito (fatura)" conta como gasto enquanto o extrato do cartão
  // não for importado; depois disso vira neutra (para não contar duas vezes).
  const FATURA = 'Fatura do cartão';
  // Despesas que se repetem todo mês com valor parecido.
  const FIXAS = ['Moradia', 'Contas da casa', 'Assinaturas', 'Educação', 'Academia'];

  const REGRAS = [
    ['Investimentos', ['aplicacao', 'resgate', ' cdb', ' rdb', ' lci', ' lca', 'tesouro direto', 'poupanca', 'corretora', 'xp investimentos', 'nuinvest', 'caixinha', 'dinheiro guardado', 'dinheiro resgatado']],
    ['Transferência entre contas', ['transferencia entre contas', 'mesma titularidade']],
    [FATURA, ['pagamento de fatura', 'pagto fatura', 'pgto fatura', 'pagamento fatura', 'fatura cartao', 'nu pagamentos', 'pagamento recebido']],
    ['Salário e renda', ['salario', 'folha de pagamento', 'proventos', 'pro labore', 'prolabore', 'rendimento', 'dividendos']],
    ['Saques', ['saque']],
    ['Mercado', ['supermercado', 'superm', ' mercado ', 'carrefour', 'pao de acucar', 'assai', 'atacadao', 'atacadista', 'hortifruti', 'sacolao', 'acougue', 'emporio', 'mercearia', 'bh supermercados', 'supernosso', 'verdemar']],
    ['Alimentação', ['ifood', '99 food', 'keeta', 'rappi', 'restaurante', 'lanchonete', 'padaria', 'panificadora', 'burger', 'pizza', 'mcdonald', 'subway', 'outback', 'starbucks', 'cafeteria', ' cafe ', 'sushi', 'churrascaria', 'habibs', 'spoleto', 'giraffas', 'coco bambu', 'madero', 'lanches', 'doceria', 'sorveteria', 'acai', 'ze delivery', ' bar ', 'boteco', 'bartata', 'canecao', 'espetinho', 'pastelaria', 'cervejaria']],
    ['Transporte', ['uber', '99app', '99 tecnologia', '99 pop', 'cabify', 'indriver', 'posto ', 'shell', 'ipiranga', 'petrobras', 'combustivel', 'estacionamento', 'estapar', 'sem parar', 'veloe', 'conectcar', ' metro ', 'onibus', 'pedagio', 'lubrificantes', 'auto pecas', 'autopecas', 'oficina', 'borracharia', 'lava jato']],
    ['Moradia', ['aluguel', 'imoveis', 'imobiliaria', 'condominio', 'quinto andar', 'quintoandar', 'iptu']],
    ['Contas da casa', ['energia', 'enel', 'cemig', 'copel', 'celesc', 'coelba', 'cpfl', 'equatorial', 'sabesp', 'sanepar', 'copasa', 'saae', 'aguas de', 'saneamento', 'comgas', ' gas ', 'telecom', 'internet', 'fibra', ' vivo ', ' claro ', ' tim ', ' oi ']],
    ['Saúde', ['farmacia', 'drogaria', 'droga raia', 'drogasil', 'pague menos', 'panvel', 'hospital', 'clinica', 'laboratorio', 'unimed', 'amil', 'sulamerica', 'hapvida', 'dentista', 'odonto', 'psicolog', 'fisioterap', 'exame', 'medico']],
    ['Academia', ['academia', 'smart fit', 'smartfit', 'bluefit', 'gympass', 'wellhub', 'totalpass', 'pilates', 'crossfit']],
    ['Cuidados pessoais', ['salao', 'barbearia', 'cabeleireiro', 'manicure', 'estetica', 'boticario', 'natura', 'sephora', 'perfumaria']],
    ['Assinaturas', ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'youtube', 'apple.com', 'icloud', 'google one', 'globoplay', 'deezer', 'paramount', 'crunchyroll', 'chatgpt', 'openai', 'anthropic', 'claude.ai', 'canva', 'adobe', 'microsoft', 'dropbox', 'notion', 'kindle unlimited', 'audible']],
    ['Compras', ['amazon', 'mercado livre', 'mercadolivre', 'shopee', 'magalu', 'magazine luiza', 'americanas', 'aliexpress', 'shein', 'temu', 'renner', 'riachuelo', 'zara', 'centauro', 'netshoes', 'decathlon', 'esporte', 'leroy merlin', 'kalunga', 'casas bahia', 'havan', 'hering', 'nike', 'adidas', 'papelaria', 'loja ']],
    ['Educação', ['escola', 'colegio', 'faculdade', 'universidade', 'curso', 'udemy', 'alura', 'coursera', 'livraria', 'mensalidade', 'duolingo']],
    ['Lazer e viagens', ['cinema', 'cinemark', 'ingresso', 'sympla', 'eventim', 'steam', 'playstation', 'xbox', 'nintendo', 'hotel', 'pousada', 'airbnb', 'booking', 'latam', 'gol linhas', 'azul linhas', 'decolar', 'turismo', ' show ', 'teatro', 'museu', 'parque']],
    ['Pets', ['petz', 'cobasi', 'petlove', 'pet shop', 'petshop', 'veterinari']],
    ['Impostos e tarifas', ['iof', 'tarifa', 'anuidade', 'juros', 'multa', 'ipva', 'darf', 'imposto', 'cesta de servicos', 'encargos', 'licenciamento', 'detran', 'estado de ', 'prefeitura', 'receita federal']],
    ['Pix e transferências', ['pix', ' ted ', ' doc ', 'transferencia']],
  ];

  function normalizar(texto) {
    return (' ' + String(texto || '') + ' ')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  // Chave para lembrar correções manuais: o nome normalizado, sem números.
  function chave(nome) {
    return normalizar(nome)
      .replace(/\d+/g, ' ')
      .replace(/[^a-z& ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function categorizar(tipo, nome, valor) {
    const texto = normalizar(tipo + ' ' + nome);
    for (const [categoria, palavras] of REGRAS) {
      if (palavras.some(p => texto.includes(p))) {
        // Pix/transferência recebido de alguém é entrada; enviado é gasto.
        if (categoria === 'Pix e transferências' && valor > 0) return 'Recebimentos';
        return categoria;
      }
    }
    return valor > 0 ? 'Recebimentos' : 'Outros';
  }

  const TODAS = [...new Set([...REGRAS.map(r => r[0]), 'Recebimentos', 'Outros'])]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  window.Categorias = { categorizar, chave, normalizar, TODAS, RECEITAS, NEUTRAS, FATURA, FIXAS };
})();
