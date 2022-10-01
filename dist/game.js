var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var enableDraw = false;

const points = new Array();
const images = new Array();

var currentBrush = 'red_color';

var socket = null;

const otherPlayers = {};

function preload ()
{        
    this.load.image('background', 'assets/background.png');
    this.load.image('red_brush', 'assets/red_color.png');
    this.load.image('red_color', 'assets/red_color.png');
    this.load.image('orange_color', 'assets/orange_color.png');
    this.load.image('orange_brush', 'assets/orange_color.png');
    this.load.image('yellow_color', 'assets/yellow_color.png');
    this.load.image('green_color', 'assets/green_color.png');
    this.load.image('blue_color', 'assets/blue_color.png');
    this.load.image('purple_color', 'assets/purple_color.png');
    this.load.image('erase', 'assets/erase.png');
}

function addPlayer(playerInfo) {
  console.log('addPlayer: ' + playerInfo.name);
}

function addOtherPlayers(playerInfo) {
  console.log('addOtherPlayers: ' + playerInfo.name);      
  otherPlayers[playerInfo.playerId] = playerInfo.name;
}

function create ()
{      
  socket = io();     
  
  socket.on('initGame', function () {          
      console.log("initGame");
    });

    socket.on('currentPlayers', function (players) {          
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          addPlayer(players[id]);
        } else {
          addOtherPlayers(players[id]);
        }
      });          
    });

    socket.on('addPlayer', function (playerInfo) {          
      addOtherPlayers(playerInfo);
    });
    
    socket.on('removePlayer', function (playerId) {
      console.log("removePlayer");

      if (otherPlayers.hasOwnProperty(playerId)) {            
        delete otherPlayers[playerId]
      }          
    });        

    var background = this.add.image(400, 300, 'background').setInteractive();
    var eraseSprite = this.add.image(100, 650, 'erase').setInteractive();

    eraseSprite.on('pointerdown', function (pointer) {
        this.setTint(0xff0000);
        eraseDrawing();
    });

    eraseSprite.on('pointerout', function (pointer) {
        this.clearTint();
    });        

    background.on('pointerdown', function (pointer) {

      enableDraw = true;

    }, this);

    background.on('pointerup', function (pointer) {

      enableDraw = false;
    }, this);

    addColorSelector(this, 'red_color', 200, 650);
    addColorSelector(this, 'orange_color', 300, 650);
    addColorSelector(this, 'yellow_color', 400, 650);
    addColorSelector(this, 'green_color', 500, 650);
    addColorSelector(this, 'blue_color', 600, 650);
    addColorSelector(this, 'purple_color', 700, 650);        

    socket.emit("getRoomNames", "world", (response1) => {
      console.log(response1);
      const roomId = response1[0]["roomId"];
      console.log('Room id ' + roomId);

      socket.emit("joinRoom", roomId, (response2) => {
        console.log("Joined Room");
        
        socket.emit("ready");
      });
    });
}

function addColorSelector(context, name, x, y)
{
  var redSprite = context.add.image(x, y, name).setInteractive();

  redSprite.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      //Set brush to red
  });

  redSprite.on('pointerout', function (pointer) {
      this.clearTint();
      currentBrush = name;
  });
}

function update(time, delta)
{
  if (enableDraw)
  {
    image = this.add.image(game.input.mousePointer.x, game.input.mousePointer.y, currentBrush);
    points.push(game.input.mousePointer)        
    images.push(image);              
  }
}

function eraseDrawing() {
  images.forEach(destroyImage);
  images.splice(0, images.length)
 }
 
 function destroyImage(image) {     
    image.destroy();
    image = null;     
}