class SceneController extends Phaser.Scene {
  constructor() {
    super({ key: 'scene_controller'});
  }

  preload() {
    
  }  

  create() {
    let self = this;
    self.scene.start('title')
  }  
}

class TitleScene extends Phaser.Scene {
  constructor() {    
    super({ key: 'title'});   
  }

  init(data) {
  }

  preload() {
    this.load.image('title_background', 'assets/title_screen.png');
    this.load.image('join_button', 'assets/join_button.png');
  }

  create() {
    let self = this;

    this.add.image(400, 300, 'title_background');
    var join_button = this.add.image(400, 700, 'join_button').setInteractive();

    join_button.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      self.scene.start('wait')
    });    
  }
}

class WaitScene extends Phaser.Scene {
  
  socket;
  players;
  otherPlayers;
  updateTextTimer;
  currentPlayerCount;
  text;

  constructor() {    
    super({ key: 'wait'});

    this.socket = null;
    this.players = {};
    this.otherPlayers = {};
    this.currentPlayerCount = 0;
    this.text = null;
  }

  init(data) {
  }

  preload() {
    this.load.image('wait_background', 'assets/wait_screen.png');
    this.load.audio('tik_tok', 'assets/tik_tok.mp3');
    this.load.spritesheet('hourglass_spritesheet', 'assets/hourglass_spritesheet.png', { frameWidth: 276, frameHeight: 276});    
    this.load.bitmapFont('atari', 'assets/atari-classic.png', 'assets/atari-classic.xml');
  }


  addPlayer(playerInfo) {
    console.log('addPlayer: ' + playerInfo.name);
  }

  addOtherPlayers(playerInfo) {
    console.log('addOtherPlayers: ' + playerInfo.name);      
    this.otherPlayers[playerInfo.playerId] = playerInfo.name;
    this.currentPlayerCount += 1;    
  }

  create() {
    let self = this;    
    self.socket = io();    
    
    self.socket.on('addPlayer', function (playerInfo) {                
      self.addOtherPlayers(playerInfo);
    });

    self.socket.on('removePlayer', function (playerId) {
      self.currentPlayerCount -= 1;

      if (self.otherPlayers.hasOwnProperty(playerId)) {            
        delete self.otherPlayers[playerId]        
      }
    });

    self.socket.on('initGame', function () {          
      console.log("initGame");

      self.scene.start('game', {'socket': self.socket})
    });
    
    self.socket.on('currentPlayers', function (players) {

      self.currentPlayerCount = Object.keys(players).length;      

      Object.keys(self.players).forEach(function (id) {
        if (self.players[id].playerId === self.socket.id) {
          self.addPlayer(self.players[id]);
        } else {
          self.addOtherPlayers(self.players[id]);
        }
      });
    });

    self.updateTextTimer = this.time.addEvent({
      callback: self.timerEvent,
      callbackScope: this,
      delay: 2000,
      loop: true
    });

    this.add.image(400, 300, 'wait_background');

    let sprite = this.add.sprite(400, 300, 'hourglass_spritesheet');

    this.anims.create({
      key: "spin",
      frameRate: 7,
      frames: this.anims.generateFrameNumbers("hourglass_spritesheet", { start: 0, end: 6 }),
      repeat: -1
  });

    sprite.play('spin');
    
    self.text = self.add.bitmapText(80, 700, 'atari', '', 32);

    self.backgroundSound = this.sound.play('tik_tok', {
      mute: false,
      volume: 1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0
    });

    self.socket.emit("joinRoom", (response) => {

      if (response === false) {
        console.log('TODO: Go to information screen');
      } else {
        console.log("Joined Room: " + response);        
        self.socket.emit("ready");
      }      
    });    
  }

 timerEvent() {
    let playersRequired = Settings.player.count - this.currentPlayerCount;    

    this.text.setText("Waiting for " + playersRequired + " more");    

    if (playersRequired === 0) {      
      this.updateTextTimer.remove(false);
    }
  }
}

class EndScene extends Phaser.Scene {
  
  socket;  
  tileData;

  tile1;
  tile2;
  tile3;
  tile4;

  constructor() {    
    super({ key: 'end'});

    this.socket = null;    
    this.tileData = null;

    this.tile1 = null;
    this.tile2 = null;
    this.tile3 = null;
    this.tile4 = null;
  }

  init(data) {    
    this.socket = data.socket;
    this.tileData = data.tileData;    
  }

  preload() {
    //this.load.image('end_background', 'assets/end_background.png');
    this.load.image('join_button', 'assets/join_button.png');
  }  

  buildTiles() {    
    this.sound.removeByKey('tik_tok');
    
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
    let self = this;
    this.socket.disconnect(true);

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
        let tileId = 'tile' + (tileIndex++ % Settings.player.count);

        this.add.image(i, j, tileId).setOrigin(0, 0).setScale(0.1);
      }
    }

    // FIXME: Cannot join immediately after finishing a game
    /*
    var join_button = this.add.image(400, 700, 'join_button').setInteractive();

    join_button.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      self.scene.start('wait')
    });
    */
  }  
}



class GameScene extends Phaser.Scene {
  enableDraw;
  points;
  images;
  currentBrush;
  socket;  

  constructor ()
  {    
    super({ key: 'game'});

    this.enableDraw = false;

    this.points = new Array();
    this.images = new Array();

    this.currentBrush = 'red_color';

    this.socket = null;    
  } 

  init(data) {    
    this.socket = data.socket;    
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
      this.load.audio('bong', 'assets/bong.mp3');
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

        self.sound.play('bong');

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
        self.scene.start('end', {'socket': self.socket, 'tileData': data})
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
    scene:  [SceneController, TitleScene, WaitScene, GameScene, EndScene]
};

let game = new Phaser.Game(config);