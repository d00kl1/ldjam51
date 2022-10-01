const path = require('path');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
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

var players = {};
io.on('connection', (socket) => {
  console.log('user connected');

  //const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey

  const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors], // colors can be omitted here as not used
    length: 2
  });

  // create a new player and add it to our players object
  players[socket.id] = {    
    playerId: socket.id,
    name: shortName    
  };

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // Introduce others to new player
  //socket.broadcast.emit('addPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    
    // remove this player
    delete players[socket.id];

    // Ask others to remove this player
    //io.emit('removePlayer', socket.id);
  });  
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});


