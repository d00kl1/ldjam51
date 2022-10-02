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

let players = {};
let rooms = {};

const ROOM_COUNT = 10;
const PLAYER_COUNT = 3;
const TURN_TIME = 10 * 1000;

for (let i = 0; i < ROOM_COUNT; ++i) {
  let a = uuidv4(); 
  rooms[a] = {
    id: a,
    name: 'TestRoom_' + i,
    currentTurn: 0,
    sockets: [],
    state: 'waiting'
  };

  console.log('created room: ' + a + ' name: ' + rooms[a].name);
}


const joinRoom = (socket, room) => {
  console.log("Joined Room: " + socket.id + ' -> ' + room.id);
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
  for (const id in rooms) {
    const room = rooms[id];

    if (room.sockets.includes(socket)) {
      socket.leave(id);
      console.log("leaveRoom user: " + socket.id + ' from ' + id);
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    
    if (room.sockets.length == 0) {      
      room.state = 'waiting';      
    }
  }
}; 

function endTurn(data) {     
     let room = data['room']

     for (const client of room.sockets) {
      console.log('Sending endTurn to ' + client.id);
      client.emit('endTurn');  
    }
}

function playTurn(room, callback) {
  console.log('playTurn');
  var turnCount = room.sockets.length - 1;
  //console.log('r = ' + room);

  for (const [key, value] of Object.entries(room)) {
    //console.log("PP");
    //console.log(key, value);
  }

  //console.log('rc = ' + room.currentTurn);
  //console.log('tc = ' + turnCount);

  if (room.currentTurn < turnCount) {
    //console.log('A');
    let origData = []

    for (let i = 0; i < room.sockets.length; i++) {
        origData.push(players[room.sockets[i].id].data);
    }

    //console.log('B');

    for (let i = 0; i < room.sockets.length; i++) {
        //console.log('C ' + i);

        let srcIndex = 0;

        if (i === 0) {
            srcIndex = room.sockets.length - 1;
        } else {
            srcIndex = i - 1;
        }

        //console.log('D');

        var data = origData[srcIndex];        

        players[room.sockets[i].id].data = Object.assign({}, data);

        //console.log('E');

        room.currentTurn += 1;
    }

    console.log('playTurn=false');
    callback(false);
  } else {
    console.log('playTurn=true');
    callback(true);
  }
}

function printPlayers() {
  for (const [key, value] of Object.entries(players)) {
    console.log("PP");
    console.log(key, value);
  }
}

io.on('connection', (socket) => {
  console.log('connected user: ' + socket.id);

  socket.on('ready', () => {    
    console.log('ready to play ' + socket.id + ' in ' +  socket.roomId);
    let room = rooms[socket.roomId];

    if (room.sockets.length === PLAYER_COUNT) {
      room.currentTurn = 0;
      room.state = 'inUse';

      for (const client of room.sockets) {
        client.emit('initGame');  
      }

      setTimeout(endTurn, TURN_TIME, {'room': room});
    }
  });
  
  socket.on('updateWork', (data) => {
    // Did we receive updateWork from all players in room?
    //console.log('socket.roomId = ' + socket.roomId);
    //console.log('playerId = ' + socket.id);

    let allUpdated = false;
    let playerCount = 0;
    let freshPlayerCount = 0
    let matchRoom = null;

    // Find all player ids in room
    for (const id in rooms) {
      let room = rooms[id];
  
      if (room.sockets.includes(socket)) {
        // Found matching room
        //console.log('Found room match = ' + room);
        matchRoom = room;

        // Check if all players in room have 'fresh' state

        for (const s of room.sockets) {
    
          if (s.id === socket.id) {
            //console.log('Found player match');
            players[s.id].state = 'fresh'
            players[s.id].data = data;
          }

          //console.log('s.id= ' + s.id);

          //console.log('state = ' + players[s.id].state);
          

          if (players[s.id].state === 'fresh') {
            freshPlayerCount += 1;
          }

          playerCount += 1;
        }
      }
    }

    //printPlayers();
    console.log('Player Count = ' + playerCount);
    console.log('Fresh Player Count = ' + freshPlayerCount);

    if (playerCount === freshPlayerCount) {
      playTurn(matchRoom, (endGame) => {
        if (endGame === true) {
          matchRoom.currentTurn = 0;
          matchRoom.state = 'waiting';

          for (const client of matchRoom.sockets) {
            client.emit('endGame');  
          }
        } else {
          for (const client of matchRoom.sockets) {
            client.emit('beginTurn', players[client.id].data);            
            players[client.id].state = 'stale';
          }

          setTimeout(endTurn, TURN_TIME, {'room': matchRoom});
        }
      })
    }
  });  
  
  socket.on('getRoomNames', (data, callback) => {
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
      currentTurn: 0,
      sockets: []
    };
  
    rooms[room.id] = room;
  
    // have the socket join the room they've just created.
    joinRoom(socket, room);
    callback();
  });
  
  socket.on('joinRoom', (callback) => {
    let joined = false;

    for (const roomId in rooms) {
      console.log('checking availability for ' + socket.id + ' in room: ' + roomId);

      let room = rooms[roomId];

      if ((room.sockets.length < PLAYER_COUNT)
          && (room.state === 'waiting')) {
        // Found availability in room
        joinRoom(socket, room);
        joined = true;
        break;
      }
    }    
    
    callback(joined);
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
    console.log('disconnected user: ' + socket.id);    

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


