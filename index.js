const http = require('http');
const fs = require('fs');
const path = require('path');

// Lista com a senha individual de cada professor
const PROFESSORES = {
  'prof_joao': 'senha123',
  'prof_maria': 'maria2026',
  'prof_carlos': 'limpeza10',
  'coordenacao': 'admin2026'
};

// O Render escolhe a porta automaticamente; no seu PC ele usa a 3000
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Link próprio dos Alunos (abre em / ou /alunos)
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

  // Link próprio dos Professores (abre em /professor)
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

  // API que entrega a lista de pontos para a tabela
  } else if (req.url === '/api/notas' && req.method === 'GET') {
    const caminhoNotas = path.join(__dirname, 'notas.json');
    const dados = fs.existsSync(caminhoNotas) ? fs.readFileSync(caminhoNotas) : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(dados);

  // API que salva os pontos validando a senha de qualquer professor cadastrado
  } else if (req.url === '/api/notas' && req.method === 'POST') {
    let corpo = '';
    req.on('data', pedaco => { corpo += pedaco; });
    req.on('end', () => {
      try {
        const pedido = JSON.parse(corpo);
        const senhasValidas = Object.values(PROFESSORES);

        if (!senhasValidas.includes(pedido.senha)) {
          res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('Senha incorreta');
        }

        const caminhoNotas = path.join(__dirname, 'notas.json');
        fs.writeFileSync(caminhoNotas, JSON.stringify(pedido.lista, null, 2));
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('OK');
      } catch (e) {
        res.writeHead(400);
        res.end('Erro nos dados enviados');
      }
    });

  // Qualquer outro endereço mostra erro 404
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
