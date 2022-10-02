const path = require('path');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { createBrotliCompress } = require('zlib');
const { v4: uuidv4 } = require('uuid');

const io = new Server(server);

const DIST_DIR = path.join(__dirname, '/dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.use(express.static(DIST_DIR));
app.get('/', (req, res) => {
  res.sendFile(HTML_FILE);
});

var players = {};

const rooms = {};

var roomCreated = false;

const joinRoom = (socket, room) => {
  console.log("Joined Room");
  room.sockets.push(socket);
  socket.join(room.id);
  socket.roomId = room.id;

  /*
  socket.join(room.id, () => {
    socket.roomId = room.id;
    console.log(socket.id, "Joined", room.id);
  });
  */
};

const leaveRooms = (socket) => {
  console.log("leaveRooms");

  const roomsToDelete = [];
  for (const id in rooms) {
    const room = rooms[id];

    if (room.sockets.includes(socket)) {
      socket.leave(id);

      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    
    if (room.sockets.length == 0) {      
      roomsToDelete.push(room);
    }
  }

  // Delete all the empty rooms that we found earlier
  for (const room of roomsToDelete) {
    delete rooms[room.id];
  }
}; 

const TURN_TIME = 10 * 1000;

/*
    setTimeout(() => {
      this.scene.start('game')
    }, 10000)
    */

function endTurn(data) {
     console.log("endTurn arg was => " + data);
     let room = data['room']

     for (const client of room.sockets) {
      console.log('Sending endTurn to ' + client.id);
      client.emit('endTurn');  
    }
}

function printPlayers() {
  for (const [key, value] of Object.entries(players)) {
    console.log("PP");
    console.log(key, value);
  }
}


io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('ready', () => {    
    const room = rooms[socket.roomId];
      
    // when we have two players... START THE GAME!
    if (room.sockets.length == 2) {      
      // tell each player to start the game.
      for (const client of room.sockets) {
        client.emit('initGame');  
      }

      setTimeout(endTurn, TURN_TIME, {'room': room});
    }
  });
  
  socket.on('updateWork', (data) => {
    // Did we receive updateWork from all players in room?
    console.log('socket.roomId = ' + socket.roomId);
    console.log('playerId = ' + socket.id);

    let allUpdated = false;
    let playerCount = 0;
    let freshPlayerCount = 0;

    // Find all player ids in room
    for (const id in rooms) {
      const room = rooms[id];
  
      if (room.sockets.includes(socket)) {
        // Found matching room
        console.log('Found room match = ' + room);

        // Check if all players in room have 'fresh' state

        for (const s of room.sockets) {
    
          if (s.id === socket.id) {
            console.log('Found player match');
            players[s.id].state = 'fresh'
            players[s.id].data = data;
          }

          console.log('s.id= ' + s.id);

          console.log('state = ' + players[s.id].state);
          

          if (players[s.id].state === 'fresh') {
            freshPlayerCount += 1;
          }

          playerCount += 1;
        }
      }
    }

    printPlayers();
    console.log('Player Count = ' + playerCount);
    console.log('Fresh Player Count = ' + freshPlayerCount);
  });  
  
  socket.on('getRoomNames', (data, callback) => {
    if (roomCreated == false) {
      const room = {
        id: uuidv4(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
        name: 'TestRoom',
        sockets: []
      };
      
      rooms[room.id] = room;
      console.log('rooms= ' + rooms);
      roomCreated = true;
    }

    const roomNames = [];

    for (const roomId in rooms) {    
      const {name} = rooms[roomId];
      const room = {name, roomId};
      roomNames.push(room);
    }

    callback(roomNames);
  });
  
   socket.on('createRoom', (roomName, callback) => {
    const room = {
      id: uuid(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
      name: roomName,
      sockets: []
    };
  
    rooms[room.id] = room;
  
    // have the socket join the room they've just created.
    joinRoom(socket, room);
    callback();
  });
  
  socket.on('joinRoom', (roomId, callback) => {
    const room = rooms[roomId];
    joinRoom(socket, room);
    callback();
  });
  
  socket.on('leaveRoom', () => {
    leaveRooms(socket);
  });  

  //const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey

  const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors], // colors can be omitted here as not used
    length: 2
  });

  // create a new player and add it to our players object
  players[socket.id] = {    
    playerId: socket.id,
    name: shortName,
    state: 'stale',
    data: null
  };

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // Introduce others to new player
  socket.broadcast.emit('addPlayer', players[socket.id]);  

  socket.on('disconnect', function () {
    console.log('user disconnected');    

    // Ask others to remove this player    
    io.emit('removePlayer', socket.id);

    leaveRooms(socket);

    // remove this player
    delete players[socket.id];    
  });  
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});


