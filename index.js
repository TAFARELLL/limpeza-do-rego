const http = require('http');
const fs = require('fs');

const SENHA_PROF = '1234';

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    fs.readFile('alunos.html', (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data || 'Crie o arquivo alunos.html');
    });
  } else if (req.url === '/professor' && req.method === 'GET') {
    fs.readFile('professor.html', (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data || 'Crie o arquivo professor.html');
    });
  } else if (req.url === '/api/notas' && req.method === 'GET') {
    const dados = fs.existsSync('notas.json') ? fs.readFileSync('notas.json') : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(dados);
  } else if (req.url === '/api/notas' && req.method === 'POST') {
    let corpo = '';
    req.on('data', p => { corpo += p; });
    req.on('end', () => {
      const pedido = JSON.parse(corpo);
      if (pedido.senha !== SENHA_PROF) {
        res.writeHead(401);
        return res.end('Senha incorreta');
      }
      fs.writeFileSync('notas.json', JSON.stringify(pedido.lista, null, 2));
      res.writeHead(200);
      res.end('OK');
    });
  }
});

server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000!');
});
