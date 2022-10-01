const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const DIST_DIR = path.join(__dirname, '/dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.use(express.static(DIST_DIR));
app.get('/', (req, res) => {
  res.sendFile(HTML_FILE);
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});