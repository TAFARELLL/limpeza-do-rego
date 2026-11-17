const http = require('http');
const fs = require('fs');
const path = require('path');

// Lista de professores e suas senhas
const PROFESSORES = {
  'Prof. Mariana': 'alfabeto',
  'Prof. Dimas': 'sacolao',
  'Prof. Geovnna': 'gatos',
  'Adriano': 'switch'
};

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Página dos Alunos
  if ((req.url === '/' || req.url === '/alunos') && req.method === 'GET') {
    const caminho = path.join(__dirname, 'alunos.html');
    fs.readFile(caminho, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Erro ao carregar a página dos alunos');
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
        return res.end('Erro ao carregar a página dos professores');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });

  // Entrega a lista de pontos para a tabela (mantém compatibilidade com alunos.html)
  } else if (req.url === '/api/notas' && req.method === 'GET') {
    const caminhoNotas = path.join(__dirname, 'notas.json');
    const dados = fs.existsSync(caminhoNotas) ? fs.readFileSync(caminhoNotas) : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(dados);

  // Entrega o histórico completo (quem lançou, data e hora)
  } else if (req.url === '/api/historico' && req.method === 'GET') {
    const caminhoHist = path.join(__dirname, 'historico.json');
    const dados = fs.existsSync(caminhoHist) ? fs.readFileSync(caminhoHist) : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(dados);

  // Salva os pontos e registra quem lançou + data e hora
  } else if (req.url === '/api/notas' && req.method === 'POST') {
    let corpo = '';
    req.on('data', pedaco => { corpo += pedaco; });
    req.on('end', () => {
      try {
        const pedido = JSON.parse(corpo);
        
        // Busca o nome do professor dono da senha
        const entradaProf = Object.entries(PROFESSORES).find(
          ([nome, senha]) => senha === pedido.senha
        );

        if (!entradaProf) {
          res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('Senha incorreta');
        }

        const nomeProfessor = entradaProf[0];

        // Gera data e hora no fuso horário de São Paulo/Brasília
        const dataHora = new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });

        // 1. Salva a tabela atualizada
        const caminhoNotas = path.join(__dirname, 'notas.json');
        fs.writeFileSync(caminhoNotas, JSON.stringify(pedido.lista, null, 2));

        // 2. Grava no arquivo de histórico para controle
        const caminhoHist = path.join(__dirname, 'historico.json');
        const historicoAtual = fs.existsSync(caminhoHist)
          ? JSON.parse(fs.readFileSync(caminhoHist))
          : [];

        historicoAtual.unshift({
          professor: nomeProfessor,
          dataHora: dataHora,
          pontuacao: pedido.lista
        });

        fs.writeFileSync(caminhoHist, JSON.stringify(historicoAtual, null, 2));

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Salvo por ${nomeProfessor} em ${dataHora}`);
      } catch (e) {
        res.writeHead(400);
        res.end('Erro nos dados enviados');
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
