const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. LISTA DE PROFESSORES E SENHAS (Edite aqui os nomes e senhas reais)
const PROFESSORES = {
  'Dimas': 'sacolao',
  'Prof. Mariana': 'alfabeto',
  'Prof. Geovanna': 'gatos',
  'Adriano': 'swtich'
};

// 2. LIMITES DE PONTUAÇÃO (Edite os valores se desejar)
const LIMITE_LANCAMENTO_MIN = -20; // Máximo que pode tirar de uma vez
const LIMITE_LANCAMENTO_MAX = 20;  // Máximo que pode dar de uma vez
const LIMITE_TOTAL_MIN = -100;     // Pontuação mínima total de uma sala
const LIMITE_TOTAL_MAX = 500;      // Pontuação máxima total de uma sala

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Página dos Alunos
  if ((req.url === '/' || req.url === '/alunos') && req.method === 'GET') {
    const caminho = path.join(__dirname, 'alunos.html');
    fs.readFile(caminho, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Erro ao carregar alunos.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });

  // Página dos Professores
  } else if (req.url === '/professor' && req.method === 'GET') {
    const caminho = path.join(__dirname, 'professor.html');
    fs.readFile(caminho, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Erro ao carregar professor.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });

  // Verifica a senha em tempo real e devolve o nome ("Olá, Dimas!")
  } else if (req.url === '/api/verificar-senha' && req.method === 'POST') {
    let corpo = '';
    req.on('data', p => { corpo += p; });
    req.on('end', () => {
      try {
        const { senha } = JSON.parse(corpo);
        const entradaProf = Object.entries(PROFESSORES).find(([nome, s]) => s === senha);
        if (!entradaProf) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ valido: false }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ valido: true, nome: entradaProf[0] }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ valido: false }));
      }
    });

  // Retorna as notas atuais
  } else if (req.url === '/api/notas' && req.method === 'GET') {
    const caminhoNotas = path.join(__dirname, 'notas.json');
    const dados = fs.existsSync(caminhoNotas) ? fs.readFileSync(caminhoNotas) : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(dados);

  // Retorna o histórico de alterações (quem, quando e o que fez)
  } else if (req.url === '/api/historico' && req.method === 'GET') {
    const caminhoHist = path.join(__dirname, 'historico.json');
    const dados = fs.existsSync(caminhoHist) ? fs.readFileSync(caminhoHist) : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(dados);

  // Salva as notas validando senha, limites e gravando data/hora
  } else if (req.url === '/api/notas' && req.method === 'POST') {
    let corpo = '';
    req.on('data', p => { corpo += p; });
    req.on('end', () => {
      try {
        const pedido = JSON.parse(corpo);

        // Valida senha
        const entradaProf = Object.entries(PROFESSORES).find(([nome, s]) => s === pedido.senha);
        if (!entradaProf) {
          res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('Senha incorreta!');
        }

        // Valida limite do lançamento individual (se não for exclusão)
        if (pedido.acao !== 'exclusao' && pedido.pontosAlterados !== undefined) {
          const ptsLancados = Number(pedido.pontosAlterados);
          if (ptsLancados < LIMITE_LANCAMENTO_MIN || ptsLancados > LIMITE_LANCAMENTO_MAX) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(`Cada lançamento deve ser entre ${LIMITE_LANCAMENTO_MIN} e +${LIMITE_LANCAMENTO_MAX} pontos.`);
          }
        }

        // Valida limite total acumulado de cada sala
        for (const item of pedido.lista) {
          if (item.pontos < LIMITE_TOTAL_MIN || item.pontos > LIMITE_TOTAL_MAX) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(`A sala ${item.sala} não pode ultrapassar os limites (${LIMITE_TOTAL_MIN} a ${LIMITE_TOTAL_MAX} pts).`);
          }
        }

        const nomeProfessor = entradaProf[0];
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        // Salva tabela atualizada
        const caminhoNotas = path.join(__dirname, 'notas.json');
        fs.writeFileSync(caminhoNotas, JSON.stringify(pedido.lista, null, 2));

        // Grava registro no histórico
        const caminhoHist = path.join(__dirname, 'historico.json');
        const historicoAtual = fs.existsSync(caminhoHist) ? JSON.parse(fs.readFileSync(caminhoHist)) : [];
        
        historicoAtual.unshift({
          professor: nomeProfessor,
          dataHora: dataHora,
          detalhe: pedido.detalhe || 'Atualizou a tabela'
        });

        fs.writeFileSync(caminhoHist, JSON.stringify(historicoAtual, null, 2));

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Olá, ${nomeProfessor}! Salvo com sucesso em ${dataHora}.`);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro ao salvar os dados.');
      }
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
