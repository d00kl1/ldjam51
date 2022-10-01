class SceneController extends Phaser.Scene {
  socket;
  otherPlayers;
  players;

  constructor() {
    //super({ key: 'title', active: true });
    super({ key: 'scene_controller'});

    this.socket = null;

    this.players = {};
    this.otherPlayers = {};
  }

  preload() {
    
  }

  addPlayer(playerInfo) {
    console.log('addPlayer: ' + playerInfo.name);
  }

  addOtherPlayers(playerInfo) {
    console.log('addOtherPlayers: ' + playerInfo.name);      
    this.otherPlayers[playerInfo.playerId] = playerInfo.name;
  }

  create() {
    let self = this;

    self.socket = io();
    
    self.socket.on('initGame', function () {          
        console.log("initGame");

        self.scene.start('game', {'socket': self.socket, 'players': self.players, 'otherPlayers': self.otherPlayers})
      });

      self.socket.on('currentPlayers', function (players) {          
        Object.keys(self.players).forEach(function (id) {
          if (self.players[id].playerId === self.socket.id) {
            self.addPlayer(self.players[id]);
          } else {
            self.addOtherPlayers(self.players[id]);
          }
        });          
      });

      self.socket.on('addPlayer', function (playerInfo) {          
        self.addOtherPlayers(playerInfo);
      });
      
      self.socket.on('removePlayer', function (playerId) {
        console.log("removePlayer");

        if (self.otherPlayers.hasOwnProperty(playerId)) {            
          delete self.otherPlayers[playerId]
        }          
      });
    
    self.scene.start('title', {'socket': self.socket, 'players': self.players, 'otherPlayers': self.otherPlayers})
  }  
}

class TitleScene extends Phaser.Scene {
  
  socket;
  players;
  otherPlayers;

  constructor() {
    //super({ key: 'title', active: true });
    super({ key: 'title'});

    this.socket = null;
    this.players = {};
    this.otherPlayers = {};    
  }

  init(data) {
    console.log('TitleScene::init', data);
    this.socket = data.socket;
    this.players = data.players;
    this.otherPlayers = data.otherPlayers;
  }

  preload() {
    this.load.image('title_background', 'assets/title_screen.png');
    this.load.image('join_button', 'assets/join_button.png');
  }

  create() {
    let self = this;

    this.add.image(400, 300, 'title_background');
    var join_button = this.add.image(400, 650, 'join_button').setInteractive();

    join_button.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      self.scene.start('wait', {'socket': self.socket, 'players': self.players, 'otherPlayers': self.otherPlayers})  
  });

    /*
    setTimeout(() => {
      this.scene.start('game')
    }, 10000)
    */
  }
}

class WaitScene extends Phaser.Scene {
  
  socket;
  players;
  otherPlayers;

  constructor() {
    //super({ key: 'title', active: true });
    super({ key: 'wait'});

    this.socket = null;
    this.players = {};
    this.otherPlayers = {};    
  }

  init(data) {
    console.log('WaitScene::init', data);
    this.socket = data.socket;
    this.players = data.players;
    this.otherPlayers = data.otherPlayers;
  }

  preload() {
    this.load.image('wait_background', 'assets/wait_screen.png');
  }

  create() {
    let self = this;    

    this.add.image(400, 300, 'wait_background');

    self.socket.emit("getRoomNames", "world", (response1) => {
      console.log(response1);
      const roomId = response1[0]["roomId"];
      console.log('Room id ' + roomId);

      self.socket.emit("joinRoom", roomId, (response2) => {
        console.log("Joined Room");
        
        self.socket.emit("ready");
      });
    });
    
  }
}


class GameScene extends Phaser.Scene {
  enableDraw;
  points;
  images;
  currentBrush;
  socket;
  otherPlayers;
  players;

  constructor ()
  {
    //super({ key: 'game', active: true });
    super({ key: 'game'});

    this.enableDraw = false;

    this.points = new Array();
    this.images = new Array();

    this.currentBrush = 'red_color';

    this.socket = null;
    this.players = {};
    this.otherPlayers = {};
  } 

  init(data) {
    console.log('GameScene::init', data);
    this.socket = data.socket;
    this.players = data.players;
    this.otherPlayers = data.otherPlayers;
  }

  preload ()
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

  create ()
  {  
    let self = this;

      var background = this.add.image(400, 300, 'background').setInteractive();
      var eraseSprite = this.add.image(100, 650, 'erase').setInteractive();

      eraseSprite.on('pointerdown', function (pointer) {
          this.setTint(0xff0000);
          self.eraseDrawing();
      });

      eraseSprite.on('pointerout', function (pointer) {
          this.clearTint();
      });        

      background.on('pointerdown', function (pointer) {

        self.enableDraw = true;

      }, this);

      background.on('pointerup', function (pointer) {

        self.enableDraw = false;
      }, this);

      this.addColorSelector('red_color', 200, 650);
      this.addColorSelector('orange_color', 300, 650);
      this.addColorSelector('yellow_color', 400, 650);
      this.addColorSelector('green_color', 500, 650);
      this.addColorSelector('blue_color', 600, 650);
      this.addColorSelector('purple_color', 700, 650);
  }

  addColorSelector(name, x, y)
  {
    let self = this;
    var redSprite = this.add.image(x, y, name).setInteractive();

    redSprite.on('pointerdown', function (pointer) {
        this.setTint(0xff0000);
        //Set brush to red
    });

    redSprite.on('pointerout', function (pointer) {
        this.clearTint();
        self.currentBrush = name;
    });
  }

  update(time, delta)
  {
    if (this.enableDraw)
    {
      let image = this.add.image(game.input.mousePointer.x, game.input.mousePointer.y, this.currentBrush);
      this.points.push(game.input.mousePointer)        
      this.images.push(image);              
    }
  }

  eraseDrawing() {
    this.images.forEach(destroyImage);
    this.images.splice(0, this.images.length)
  }
  
  destroyImage(image) {     
      image.destroy();
      image = null;     
  }
}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,    
    scene:  [SceneController, TitleScene, WaitScene, GameScene]
};

let game = new Phaser.Game(config);