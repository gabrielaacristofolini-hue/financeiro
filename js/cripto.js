/*
 * Cifra os dados com senha usando a Web Crypto API do navegador:
 * PBKDF2 (SHA-256, 600 mil iterações) para derivar a chave + AES-GCM 256 bits.
 * Sem a senha, o arquivo publicado no GitHub é ilegível.
 */
(function () {
  'use strict';

  const ITERACOES = 600000;

  const paraB64 = buf => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const deB64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  async function derivarChave(senha, salt, iteracoes) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: iteracoes, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function cifrar(objeto, senha) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const chave = await derivarChave(senha, salt, ITERACOES);
    const dados = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, new TextEncoder().encode(JSON.stringify(objeto)));
    return {
      formato: 'financas-cifrado', versao: 1, iteracoes: ITERACOES,
      salt: paraB64(salt), iv: paraB64(iv), dados: paraB64(dados),
      geradoEm: new Date().toISOString().slice(0, 10),
    };
  }

  async function decifrar(arquivo, senha) {
    const chave = await derivarChave(senha, deB64(arquivo.salt), arquivo.iteracoes || ITERACOES);
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(arquivo.iv) }, chave, deB64(arquivo.dados));
    return JSON.parse(new TextDecoder().decode(claro));
  }

  window.Cripto = { cifrar, decifrar, disponivel: !!(window.crypto && crypto.subtle) };
})();
