class SceneController extends Phaser.Scene {
  socket;
  otherPlayers;
  players;

  constructor() {
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

class TileScene extends Phaser.Scene {
  tile1;
  tile2;
  tile3;
  tile4;

  constructor() {    
    super({ key: 'tile'});
    this.tile1 = null;
    this.tile2 = null;
    this.tile3 = null;
    this.tile4 = null;
  }

  preload ()
  {
      //this.load.image('red_brush', 'assets/red_color.png');
  }

  /*
  create ()
  {
    var texture = this.textures.createCanvas('aatest', 256, 256);

    var ctx = texture.context;

    // ctx.fillStyle = '#ffffff';
    // ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.bezierCurveTo(20, 100, 200, 100, 200, 20);
    ctx.stroke();

    texture.refresh();

    this.add.image(300, 200, 'aatest');

    this.add.image(600, 200, 'aatest').setAngle(20);

    this.add.image(300, 450, 'red_brush').setScale(0.10);
    this.add.image(600, 450, 'red_brush').setAngle(20);
  }
  */

  create () {
    this.tile0 = this.textures.createCanvas('tile0', 80, 80);
    this.tile1 = this.textures.createCanvas('tile1', 80, 80);
    this.tile2 = this.textures.createCanvas('tile2', 80, 80);
    this.tile3 = this.textures.createCanvas('tile3', 80, 80);

    this.tile0.context.fillStyle = '#00ffff';
    this.tile0.context.fillRect(0, 0, 80, 80);

    this.tile1.context.fillStyle = '#00ff00';
    this.tile1.context.fillRect(0, 0, 80, 80);

    this.tile2.context.fillStyle = '#f0f0f0';
    this.tile2.context.fillRect(0, 0, 80, 80);

    this.tile3.context.fillStyle = '#0f0f0f';
    this.tile3.context.fillRect(0, 0, 80, 80);

    this.tile0.refresh();
    this.tile1.refresh();
    this.tile2.refresh();
    this.tile3.refresh();

    let tileIndex = 0;
    let j = 0;


    for (let j = 0; j < 800; j += 80) {      
      for (let i = 0; i < 800; i += 80) {
          this.add.image(i, j, 'tile' + (tileIndex++ % 4)).setOrigin(0, 0).setScale(0.1);
      }
    }
  }
}


class TitleScene extends Phaser.Scene {
  
  socket;
  players;
  otherPlayers;

  constructor() {    
    super({ key: 'title'});

    this.socket = null;
    this.players = {};
    this.otherPlayers = {};    
  }

  init(data) {    
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
  }
}

class WaitScene extends Phaser.Scene {
  
  socket;
  players;
  otherPlayers;

  constructor() {    
    super({ key: 'wait'});

    this.socket = null;
    this.players = {};
    this.otherPlayers = {};    
  }

  init(data) {    
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

    self.socket.emit("joinRoom", (response) => {

      if (response === false) {
        console.log('TODO: Go to information screen');
      } else {
        console.log("Joined Room: " + response);        
        self.socket.emit("ready");
      }      
    });    
  }
}

class EndScene extends Phaser.Scene {
  
  socket;
  players;
  otherPlayers;
  tileData;

  tile1;
  tile2;
  tile3;
  tile4;

  constructor() {
    //super({ key: 'title', active: true });
    super({ key: 'end'});

    this.socket = null;    
    this.players = {};
    this.otherPlayers = {};    
    this.tileData = null;

    this.tile1 = null;
    this.tile2 = null;
    this.tile3 = null;
    this.tile4 = null;
  }

  init(data) {    
    this.socket = data.socket;
    this.players = data.players;
    this.otherPlayers = data.otherPlayers;
    this.tileData = data.tileData;    
  }

  preload() {
    //this.load.image('end_background', 'assets/end_background.png');
  }  

  buildTiles() {    
    let RED_COLOR = '#fe5b59';
    let YELLOW_COLOR = '#f3ce52';
    let ORANGE_COLOR = '#f7a547';
    let GREEN_COLOR = '#6acd5b';
    let BLUE_COLOR = '#57b9f2';
    let PURPLE_COLOR = '#d186df';

    let tilesToBuild = [this.tile0, this.tile1, this.tile2, this.tile3];
    let currTileToBuildIndex = 0
    let currTileToBuild = null;

    for (const [key, value] of Object.entries(this.tileData)) {      
      currTileToBuild = tilesToBuild[currTileToBuildIndex];

      for (const [k, v] of Object.entries(value)) {        
          let x = v['x'];
          let y = v['y'];
          let c = v['c'];

          if (c === 'red_color') {
            currTileToBuild.context.fillStyle = RED_COLOR;
          } else if (c === 'orange_color') {
            currTileToBuild.context.fillStyle = ORANGE_COLOR;
          } else if (c === 'yellow_color') {
            currTileToBuild.context.fillStyle = YELLOW_COLOR;
          } else if (c === 'green_color') {
            currTileToBuild.context.fillStyle = GREEN_COLOR;
          } else if (c === 'blue_color') {
            currTileToBuild.context.fillStyle = BLUE_COLOR;
          } else if (c === 'purple_color') {
            currTileToBuild.context.fillStyle = PURPLE_COLOR;
          }

          currTileToBuild.context.fillRect(x, y, 64, 64);
        }

        currTileToBuildIndex += 1;
        //);
      //}
    }
  }
  
  create () {
    let PLAYER_COUNT = 4;
    let self = this;
    //this.add.image(0, 0, 'end_background').setOrigin(0, 0);

    this.tile0 = this.textures.createCanvas('tile0', 800, 800);
    this.tile1 = this.textures.createCanvas('tile1', 800, 800);
    this.tile2 = this.textures.createCanvas('tile2', 800, 800);
    this.tile3 = this.textures.createCanvas('tile3', 800, 800);

    this.tile0.context.fillStyle = '#e0e0e0';
    this.tile0.context.fillRect(0, 0, 800, 800);
    this.tile1.context.fillStyle = '#e0e0e0';
    this.tile1.context.fillRect(0, 0, 800, 800);
    this.tile2.context.fillStyle = '#e0e0e0';
    this.tile2.context.fillRect(0, 0, 800, 800);
    this.tile3.context.fillStyle = '#e0e0e0';
    this.tile3.context.fillRect(0, 0, 800, 800);

    self.buildTiles();

    this.tile0.refresh();
    this.tile1.refresh();
    this.tile2.refresh();
    this.tile3.refresh();

    let tileIndex = 0;
    let j = 0;

    for (let j = 0; j < 800; j += 80) {      
      for (let i = 0; i < 800; i += 80) {
        let tileId = 'tile' + (tileIndex++ % PLAYER_COUNT);

        this.add.image(i, j, tileId).setOrigin(0, 0).setScale(0.1);
      }
    }
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

      self.socket.on('endTurn', function () {          
        console.log("endTurn");

        // Send drawing to server
        self.socket.emit("updateWork", self.points, () => {
          console.log("Updated work");          
        });
      });

      self.socket.on('beginTurn', function (data) {          
        console.log("beginTurn");

        // Erase everything
        self.eraseDrawing();

        for (const [key, value] of Object.entries(data)) {
          let x = value['x'];
          let y = value['y'];
          let c = value['c'];
          
          let image = self.add.image(x, y, c);
          self.points.push({'x': x, 'y': y, 'c': c});
          self.images.push(image); 
        }
      });

      self.socket.on('endGame', function (data) {
        self.scene.start('end', {'socket': self.socket, 'players': self.players, 'otherPlayers': self.otherPlayers, 'tileData': data})
      });
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
      this.points.push({'x': game.input.mousePointer.x, 'y': game.input.mousePointer.y, 'c': this.currentBrush});
      this.images.push(image);              
    }
  }

  eraseDrawing() {
    console.log('eraseDrawing');
    this.points.splice(0, this.points.length)
    this.images.forEach(this.destroyImage);
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
    height: 800,    
    //scene:  [TileScene, SceneController, TitleScene, WaitScene, GameScene, EndScene]
    scene:  [SceneController, TitleScene, WaitScene, GameScene, EndScene]
};

let game = new Phaser.Game(config);