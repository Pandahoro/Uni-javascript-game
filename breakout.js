var Breakout = new Phaser.Class({

    Extends: Phaser.Scene,


    initialize:

    function Breakout ()
    {
        Phaser.Scene.call(this, { key: 'breakout' });

        this.bricks;
        this.paddle;
        this.ball;
        this.ball2; // becca: new global for the second ball
        this.lives = 2; // Becca: added a global lives that can be read in the if statement where the ball goes off the screen in the update function
        //this.bricksLeft = 60; //Becca: Original idea was to use global variable but then thought to see if i could use the this.bricks.activecount instead
        this.ball2InPlay = false // Becca: global flag to see if the 2nd ball in play, used to stop ball resetting when powerup is gained while its allready in use
        this.score = 0;
        
    },
    

    preload: function ()
    {
        // Becca: ##audio loading##
        this.load.audio('theme', ['assets/games/breakout/Space_Cadet.ogg', 'assets/games/breakout/Space_Cadet.mp3']); //Becca: Loading the audio assets, loading both mp3 and ogg for muliformat support
        this.load.audio('ballHit',['assets/games/breakout/impactSoft_medium_001.ogg', 'assets/games/breakout/impactSoft_medium_001.mp3']);
        this.load.audio('ballPaddleHit',['assets/games/breakout/impactTin_medium_001.ogg', 'assets/games/breakout/impactTin_medium_001.mp3']);
        this.load.audio('gameWinSound',['assets/games/breakout/you_win.ogg', 'assets/games/breakout/you_win.mp3']);
        this.load.audio('gameLostSound',['assets/games/breakout/game_over.ogg', 'assets/games/breakout/game_over.mp3']);
        this.load.audio('loseLife',['assets/games/breakout/laserRetro_001.ogg', 'assets/games/breakout/laserRetro_001.mp3']);
        this.load.audio('shootSound',['assets/games/breakout/laserSmall_002.ogg', 'assets/games/breakout/laserSmall_002.mp3']);

        //##assett loading##
        this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    },

    

    create: function ()
    {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        let music = this.sound.add('theme') // Becca: creating the object for the audio to play later on in the game
        this.hitSound = this.sound.add('ballHit') // Becca: creating a sound object for when the ball hits  bricks
        this.hitSound2 = this.sound.add('ballPaddleHit') // Becca: creating a sound object for when the ball hits paddle
        this.gameWonSound = this.sound.add('gameWinSound') // Becca: creating a sound object for when game won
        this.gameOverSound = this.sound.add('gameLostSound') // Becca: creating a sound object for when game lost
        this.lifeLostSound = this.sound.add('loseLife')// Becca: sound when ball 1 goes off screen resulting in life lost
        this.fireSound = this.sound.add('shootSound')// becca: used to mask sounds


        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);
        this.ball2 = this.physics.add.image(900, 900, 'assets', 'ball2').setCollideWorldBounds(true).setBounce(1); //Becca: duplication of the ball for the powerup
        this.ball2.setData('onPaddle', false);

        // Becca Creates a UI for the remaining lives to be displayed
        this.livesText = this.add.text(20,20, '', { font: '12px Courier', fill: '#ecb3c6' }); 
        this.brickText = this.add.text(20,30, '', { font: '12px Courier', fill: '#ecb3c6' });
        this.scoreText = this.add.text(20,40, '', { font: '12px Courier', fill: '#ecb3c6' });

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball2, this.bricks, this.hitBrick2, null, this);// becca: setting collisions for the 2nd ball to have collision detection with bricks and paddle and to trigger respective functions
        this.physics.add.collider(this.ball2, this.paddle, this.hitPaddle2, null, this);
        
         
 
         

        //  Input events
        this.input.on('pointermove', function (pointer) {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }
            if (this.ball2.getData('onPaddle')) //becca: duplication of ball on paddle for ball 2 to clamp it to the paddle when spawned
            {
                this.ball2.x = this.paddle.x;
            }

        }, this);
        
        this.input.on('pointerup', function (pointer) {

            var musicConfig = { // Becca: config for audio, making the audio unmuted, reducing volume to save ears, speeding it up slightly and giving it a slight detune and setting it to loop
                mute: false,
                volume: 0.2,
                rate: 2,
                detune: 50,
                seek: 0,
                loop: true,
                delay: 0
            }
            music.play(musicConfig); // Becca: starting the music again when the ball is launched
            this.fireSound.play() // firing sound, totally not here just to mask the music starting again when you fire

            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

            if (this.ball2.getData('onPaddle'))
            {
                this.ball2.setVelocity(-75, -300);
                this.ball2.setData('onPaddle', false);
            }

        }, this);

        
        
        
    },
   
    

   
    hitBrick: function (ball, brick)
    {
        brick.disableBody(true, true);
        this.hitSound.play() //becca: playing inpact sound when it hits a brick
        this.score = this.score + 1000
        if (this.bricks.countActive() === 0)
        {
            this.gameWonSound.play()// Becca: play sound when game one
            this.resetLevel();
            this.bricksLeft = 60
            this.resetBall2() // becca: calls resetball 2 to move it offscreen and set velocity to 0
            this.scene.start('sceneWin'); // changes scene to the win scene
        }
    },

    hitBrick2: function (ball2, brick)//becca: function for second ball
    {
        brick.disableBody(true, true);
        this.hitSound.play() //becca: playing inpact sound when it hits a brick

        
        this.score = this.score + 1500
        
        if (this.bricks.countActive() === 0)
        {
            this.gameWonSound.play()// Becca: play sound when game one
            this.resetLevel();
            this.bricksLeft = 60
            this.resetBall2() //Becca: calls resetball 2 to move it offscreen and set velocity to 0
            this.scene.start('sceneWin'); // changes scene to the win screen
        }
    },

    resetBall: function ()
    {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    },

    addBall2: function () //Becca: put second ball on paddle to use and puts flag to say it is in play so it does not get reset
    {
        this.ball2.setVelocity(0);
        this.ball2.setPosition(this.paddle.x, 500);
        this.ball2.setData('onPaddle', true);
        this.ball2InPlay = true
        
    },

    resetBall2: function () //Becca: move ball off screen when out of bounds and sets ball to not in play
    {
        this.ball2.setVelocity(0);
        this.ball2.setPosition(900, 900);
        this.ball2.setData('onPaddle', false);
        this.ball2InPlay = false
        
    },

    resetLevel: function ()
    {
        
        this.resetBall();

        this.lives = 2;

        this.score = 0;

        this.bricks.children.each(function (brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    //livesLeft: function () unused test for original idea for a lives system before switching to one used
    //{
        
    //},


    hitPaddle: function (ball, paddle)
    {
        var diff = 0;

        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5) // Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5)// Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5)// Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
    },
   
    hitPaddle2: function (ball2, paddle)
    {
        var diff = 0;

        if (ball2.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball2.x;
            ball2.setVelocityX(-10 * diff);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
        else if (ball2.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball2.x -paddle.x;
            ball2.setVelocityX(10 * diff);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball2.setVelocityX(2 + Math.random() * 8);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
    },

    update: function ()
    {

        var bricksLeft = this.bricks.countActive();
        this.scoreText.setText (['Score: ' + this.score]);
        this.livesText.setText(['Lives: ' + this.lives]); //Becca: updates the text to desplay the remaining lives
        //this.
        this.brickText.setText(['Bricks Left: ' + bricksLeft]); 

        if (this.ball.y > 600)
        {
            this.resetBall();
            this.lifeLostSound.play() // Becca: play sound when life lost

            this.lives--;
            if (this.lives < 0)
                {

                    this.gameOverSound.play()// Becca: play game over sound
                    this.resetLevel();
                    this.scene.start('sceneLose');
                    
                }
            
          
        }

        if (this.ball2.y > 600) // Becca: if ball goes out of bounds, call reset function to move it and remove velocity
        {
            this.resetBall2();
            
          
        }
    
    },

    

});

var sceneWin = new Phaser.Class({ // becca: this sets up the new scene and creates a new class for all the scene data to be contained within, with this i can easily add a new level

    Extends: Phaser.Scene, //becca: makes the scene


    initialize: // becca: starts the functions

    function sceneWin () // becca: labels this as sceneWin so it can be called by the other scenes
    {
        Phaser.Scene.call(this, { key: 'sceneWin' });
    },

    preload: function () //becca: preloading of assets
    {
        this.load.image('Win1', 'assets/games/breakout/Win1.png');
    },

    create: function () // creating the display of assets
    {
        this.add.image(400,300, 'Win1')
        this.input.once('pointerup', function (event){ this.scene.start('breakoutLevel2');}, this);
    },

    update: function()//Becca: functions inside this will update every frame
    {

    }
});

var sceneLose = new Phaser.Class({ //Becca: same as the win scene, but for the lose scenario

    Extends: Phaser.Scene,


    initialize:

    function sceneWin ()
    {
        Phaser.Scene.call(this, { key: 'sceneLose' });
    },

    preload: function ()
    {
        this.load.image('Lose', 'assets/games/breakout/lose.png');

    },

    create: function ()
    {
        this.add.image(400, 300, 'Lose');
        this.input.once('pointerup', function (event){ this.scene.start('breakout');}, this);
    },

    update: function()
    {

    }
});


var BreakoutLevel2 = new Phaser.Class({

    Extends: Phaser.Scene,


    initialize:

    function BreakoutLevel2 ()
    {
        Phaser.Scene.call(this, { key: 'breakoutLevel2' });

        this.bricks;
        this.paddle;
        this.ball;
        this.ball2; // becca: new global for the second ball
        this.lives = 2; // Becca: added a global lives that can be read in the if statement where the ball goes off the screen in the update function
        //this.bricksLeft = 60; //Becca: Original idea was to use global variable but then thought to see if i could use the this.bricks.activecount instead
        this.ball2InPlay = false // Becca: global flag to see if the 2nd ball in play, used to stop ball resetting when powerup is gained while its allready in use
        this.score = 0;
        
    },
    

    preload: function ()
    {
        // Becca: ##audio loading##
        this.load.audio('theme', ['assets/games/breakout/Space_Cadet.ogg', 'assets/games/breakout/Space_Cadet.mp3']); //Becca: Loading the audio assets, loading both mp3 and ogg for muliformat support
        this.load.audio('ballHit',['assets/games/breakout/impactSoft_medium_001.ogg', 'assets/games/breakout/impactSoft_medium_001.mp3']);
        this.load.audio('ballPaddleHit',['assets/games/breakout/impactTin_medium_001.ogg', 'assets/games/breakout/impactTin_medium_001.mp3']);
        this.load.audio('gameWinSound',['assets/games/breakout/you_win.ogg', 'assets/games/breakout/you_win.mp3']);
        this.load.audio('gameLostSound',['assets/games/breakout/game_over.ogg', 'assets/games/breakout/game_over.mp3']);
        this.load.audio('loseLife',['assets/games/breakout/laserRetro_001.ogg', 'assets/games/breakout/laserRetro_001.mp3']);
        this.load.audio('shootSound',['assets/games/breakout/laserSmall_002.ogg', 'assets/games/breakout/laserSmall_002.mp3']);

        //##assett loading##
        this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    },

    

    create: function ()
    {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        let music = this.sound.add('theme') // Becca: creating the object for the audio to play later on in the game
        this.hitSound = this.sound.add('ballHit') // Becca: creating a sound object for when the ball hits  bricks
        this.hitSound2 = this.sound.add('ballPaddleHit') // Becca: creating a sound object for when the ball hits paddle
        this.gameWonSound = this.sound.add('gameWinSound') // Becca: creating a sound object for when game won
        this.gameOverSound = this.sound.add('gameLostSound') // Becca: creating a sound object for when game lost
        this.lifeLostSound = this.sound.add('loseLife')// Becca: sound when ball 1 goes off screen resulting in life lost
        this.fireSound = this.sound.add('shootSound')// becca: used to mask sounds


        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1', 'blue1', 'red1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 8, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);
        this.ball2 = this.physics.add.image(900, 900, 'assets', 'ball2').setCollideWorldBounds(true).setBounce(1); //Becca: duplication of the ball for the powerup
        this.ball2.setData('onPaddle', false);

        // Becca Creates a UI for the remaining lives to be displayed
        this.livesText = this.add.text(20,20, '', { font: '12px Courier', fill: '#ecb3c6' }); 
        this.brickText = this.add.text(20,30, '', { font: '12px Courier', fill: '#ecb3c6' });
        this.scoreText = this.add.text(20,40, '', { font: '12px Courier', fill: '#ecb3c6' });

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball2, this.bricks, this.hitBrick2, null, this);// becca: setting collisions for the 2nd ball to have collision detection with bricks and paddle and to trigger respective functions
        this.physics.add.collider(this.ball2, this.paddle, this.hitPaddle2, null, this);
        
         
 
         

        //  Input events
        this.input.on('pointermove', function (pointer) {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }
            if (this.ball2.getData('onPaddle')) //becca: duplication of ball on paddle for ball 2 to clamp it to the paddle when spawned
            {
                this.ball2.x = this.paddle.x;
            }

        }, this);
        
        this.input.on('pointerup', function (pointer) {

            var musicConfig = { // Becca: config for audio, making the audio unmuted, reducing volume to save ears, speeding it up slightly and giving it a slight detune and setting it to loop
                mute: false,
                volume: 0.2,
                rate: 2,
                detune: 50,
                seek: 0,
                loop: true,
                delay: 0
            }
            music.play(musicConfig); // Becca: starting the music again when the ball is launched
            this.fireSound.play() // firing sound, totally not here just to mask the music starting again when you fire

            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

            if (this.ball2.getData('onPaddle'))
            {
                this.ball2.setVelocity(-75, -300);
                this.ball2.setData('onPaddle', false);
            }

        }, this);

        
        
        
    },
   
    

   
    hitBrick: function (ball, brick)
    {
        brick.disableBody(true, true);
        this.hitSound.play() //becca: playing inpact sound when it hits a brick
        
        this.score = this.score + 1000
        
        if (this.bricks.countActive() === 0)
        {
            this.gameWonSound.play()// Becca: play sound when game one
            this.resetLevel();
            this.bricksLeft = 60
            this.resetBall2() // becca: calls resetball 2 to move it offscreen and set velocity to 0
            this.scene.start('sceneWin2'); // changes scene to the win scene
        }
    },

    hitBrick2: function (ball2, brick)//becca: function for second ball
    {
        brick.disableBody(true, true);
        this.hitSound.play() //becca: playing inpact sound when it hits a brick
        
        this.score = this.score + 1500
        
        if (this.bricks.countActive() === 0)
        {
            this.gameWonSound.play()// Becca: play sound when game one
            this.resetLevel();
            this.bricksLeft = 60
            this.resetBall2() //Becca: calls resetball 2 to move it offscreen and set velocity to 0
            this.scene.start('sceneWin2'); // changes scene to the win screen
        }
    },

    resetBall: function ()
    {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    },

    addBall2: function () //Becca: put second ball on paddle to use and puts flag to say it is in play so it does not get reset
    {
        this.ball2.setVelocity(0);
        this.ball2.setPosition(this.paddle.x, 500);
        this.ball2.setData('onPaddle', true);
        this.ball2InPlay = true
        
    },

    resetBall2: function () //Becca: move ball off screen when out of bounds and sets ball to not in play
    {
        this.ball2.setVelocity(0);
        this.ball2.setPosition(900, 900);
        this.ball2.setData('onPaddle', false);
        this.ball2InPlay = false
        
    },

    resetLevel: function ()
    {
        
        this.resetBall();

        this.lives = 3;
        this.score = 0;

        this.bricks.children.each(function (brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    //livesLeft: function () unused test for original idea for a lives system before switching to one used
    //{
        
    //},


    hitPaddle: function (ball, paddle)
    {
        var diff = 0;

        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5) // Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5)// Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5)// Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
    },
   
    hitPaddle2: function (ball2, paddle)
    {
        var diff = 0;

        if (ball2.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball2.x;
            ball2.setVelocityX(-10 * diff);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
        else if (ball2.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball2.x -paddle.x;
            ball2.setVelocityX(10 * diff);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball2.setVelocityX(2 + Math.random() * 8);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
    },

    update: function ()
    {

        var bricksLeft = this.bricks.countActive();
        this.livesText.setText(['Lives: ' + this.lives]); //Becca: updates the text to desplay the remaining lives
        //this.
        this.brickText.setText(['Bricks Left: ' + bricksLeft]); 
        this.scoreText.setText (['Score: ' + this.score]);

        if (this.ball.y > 600)
        {
            this.resetBall();
            this.lifeLostSound.play() // Becca: play sound when life lost

            this.lives--;
            if (this.lives < 0)
                {

                    this.gameOverSound.play()// Becca: play game over sound
                    this.resetLevel();
                    this.scene.start('sceneLose');
                    
                }
            
          
        }

        if (this.ball2.y > 600) // Becca: if ball goes out of bounds, call reset function to move it and remove velocity
        {
            this.resetBall2();
            
          
        }
    
    },

    

});

var BreakoutLevel3 = new Phaser.Class({

    Extends: Phaser.Scene,


    initialize:

    function BreakoutLevel3 ()
    {
        Phaser.Scene.call(this, { key: 'breakoutLevel3' });

        this.bricks;
        this.paddle;
        this.ball;
        this.ball2; // becca: new global for the second ball
        this.lives = 2; // Becca: added a global lives that can be read in the if statement where the ball goes off the screen in the update function
        //this.bricksLeft = 60; //Becca: Original idea was to use global variable but then thought to see if i could use the this.bricks.activecount instead
        this.ball2InPlay = false // Becca: global flag to see if the 2nd ball in play, used to stop ball resetting when powerup is gained while its allready in use
        this.score = 0;
        
    },
    

    preload: function ()
    {
        // Becca: ##audio loading##
        this.load.audio('theme', ['assets/games/breakout/Space_Cadet.ogg', 'assets/games/breakout/Space_Cadet.mp3']); //Becca: Loading the audio assets, loading both mp3 and ogg for muliformat support
        this.load.audio('ballHit',['assets/games/breakout/impactSoft_medium_001.ogg', 'assets/games/breakout/impactSoft_medium_001.mp3']);
        this.load.audio('ballPaddleHit',['assets/games/breakout/impactTin_medium_001.ogg', 'assets/games/breakout/impactTin_medium_001.mp3']);
        this.load.audio('gameWinSound',['assets/games/breakout/you_win.ogg', 'assets/games/breakout/you_win.mp3']);
        this.load.audio('gameLostSound',['assets/games/breakout/game_over.ogg', 'assets/games/breakout/game_over.mp3']);
        this.load.audio('loseLife',['assets/games/breakout/laserRetro_001.ogg', 'assets/games/breakout/laserRetro_001.mp3']);
        this.load.audio('shootSound',['assets/games/breakout/laserSmall_002.ogg', 'assets/games/breakout/laserSmall_002.mp3']);

        //##assett loading##
        this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    },

    

    create: function ()
    {
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        let music = this.sound.add('theme') // Becca: creating the object for the audio to play later on in the game
        this.hitSound = this.sound.add('ballHit') // Becca: creating a sound object for when the ball hits  bricks
        this.hitSound2 = this.sound.add('ballPaddleHit') // Becca: creating a sound object for when the ball hits paddle
        this.gameWonSound = this.sound.add('gameWinSound') // Becca: creating a sound object for when game won
        this.gameOverSound = this.sound.add('gameLostSound') // Becca: creating a sound object for when game lost
        this.lifeLostSound = this.sound.add('loseLife')// Becca: sound when ball 1 goes off screen resulting in life lost
        this.fireSound = this.sound.add('shootSound')// becca: used to mask sounds


        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1', 'blue1', 'red1', 'green1', 'yellow1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 10, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);
        this.ball2 = this.physics.add.image(900, 900, 'assets', 'ball2').setCollideWorldBounds(true).setBounce(1); //Becca: duplication of the ball for the powerup
        this.ball2.setData('onPaddle', false);

        // Becca Creates a UI for the remaining lives to be displayed
        this.livesText = this.add.text(20,20, '', { font: '12px Courier', fill: '#ecb3c6' }); 
        this.brickText = this.add.text(20,30, '', { font: '12px Courier', fill: '#ecb3c6' });
        this.scoreText = this.add.text(20,40, '', { font: '12px Courier', fill: '#ecb3c6' });

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball2, this.bricks, this.hitBrick2, null, this);// becca: setting collisions for the 2nd ball to have collision detection with bricks and paddle and to trigger respective functions
        this.physics.add.collider(this.ball2, this.paddle, this.hitPaddle2, null, this);
        
         
 
         

        //  Input events
        this.input.on('pointermove', function (pointer) {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }
            if (this.ball2.getData('onPaddle')) //becca: duplication of ball on paddle for ball 2 to clamp it to the paddle when spawned
            {
                this.ball2.x = this.paddle.x;
            }

        }, this);
        
        this.input.on('pointerup', function (pointer) {

            var musicConfig = { // Becca: config for audio, making the audio unmuted, reducing volume to save ears, speeding it up slightly and giving it a slight detune and setting it to loop
                mute: false,
                volume: 0.2,
                rate: 2,
                detune: 50,
                seek: 0,
                loop: true,
                delay: 0
            }
            music.play(musicConfig); // Becca: starting the music again when the ball is launched
            this.fireSound.play() // firing sound, totally not here just to mask the music starting again when you fire

            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

            if (this.ball2.getData('onPaddle'))
            {
                this.ball2.setVelocity(-75, -300);
                this.ball2.setData('onPaddle', false);
            }

        }, this);

        
        
        
    },
   
    

   
    hitBrick: function (ball, brick)
    {
        brick.disableBody(true, true);
        this.hitSound.play() //becca: playing inpact sound when it hits a brick
        
        this.score = this.score + 1000
        
        if (this.bricks.countActive() === 0)
        {
            this.gameWonSound.play()// Becca: play sound when game one
            this.resetLevel();
            this.bricksLeft = 60
            this.resetBall2() // becca: calls resetball 2 to move it offscreen and set velocity to 0
            this.scene.start('sceneWin3'); // changes scene to the win scene
        }
    },

    hitBrick2: function (ball2, brick)//becca: function for second ball
    {
        brick.disableBody(true, true);
        this.hitSound.play() //becca: playing inpact sound when it hits a brick
        
        this.score = this.score + 1500
        
        if (this.bricks.countActive() === 0)
        {
            this.gameWonSound.play()// Becca: play sound when game one
            this.resetLevel();
            this.bricksLeft = 60
            this.resetBall2() //Becca: calls resetball 2 to move it offscreen and set velocity to 0
            this.scene.start('sceneWin3'); // changes scene to the win screen
        }
    },

    resetBall: function ()
    {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    },

    addBall2: function () //Becca: put second ball on paddle to use and puts flag to say it is in play so it does not get reset
    {
        this.ball2.setVelocity(0);
        this.ball2.setPosition(this.paddle.x, 500);
        this.ball2.setData('onPaddle', true);
        this.ball2InPlay = true
        
    },

    resetBall2: function () //Becca: move ball off screen when out of bounds and sets ball to not in play
    {
        this.ball2.setVelocity(0);
        this.ball2.setPosition(900, 900);
        this.ball2.setData('onPaddle', false);
        this.ball2InPlay = false
        
    },

    resetLevel: function ()
    {
        
        this.resetBall();

        this.lives = 3;
        this.score = 0;

        this.bricks.children.each(function (brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    //livesLeft: function () unused test for original idea for a lives system before switching to one used
    //{
        
    //},


    hitPaddle: function (ball, paddle)
    {
        var diff = 0;

        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5) // Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5)// Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
            let ballSpawn = Phaser.Math.Between(1,10); // becca: random number gen between 1- 10
            this.hitSound2.play()// Becca: play diff sound when hits paddle
            if (ballSpawn > 5)// Becca: gives second ball a 50% chance of spawning if it is not in play
            {
                if (this.ball2InPlay == false)//becca: check to see if the ball is in play and then spawns it if it now
                {
                    this.addBall2();
                    
                }
            }
        }
    },
   
    hitPaddle2: function (ball2, paddle)
    {
        var diff = 0;

        if (ball2.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball2.x;
            ball2.setVelocityX(-10 * diff);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
        else if (ball2.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball2.x -paddle.x;
            ball2.setVelocityX(10 * diff);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball2.setVelocityX(2 + Math.random() * 8);
            this.hitSound2.play()// Becca: play diff sound when hits paddle
        }
    },

    update: function ()
    {

        var bricksLeft = this.bricks.countActive();
        this.livesText.setText(['Lives: ' + this.lives]); //Becca: updates the text to desplay the remaining lives
        //this.
        this.brickText.setText(['Bricks Left: ' + bricksLeft]); 
        this.scoreText.setText (['Score: ' + this.score]);

        if (this.ball.y > 600)
        {
            this.resetBall();
            this.lifeLostSound.play() // Becca: play sound when life lost

            this.lives--;
            if (this.lives < 0)
                {

                    this.gameOverSound.play()// Becca: play game over sound
                    this.resetLevel();
                    this.scene.start('sceneLose');
                    
                }
            
          
        }

        if (this.ball2.y > 600) // Becca: if ball goes out of bounds, call reset function to move it and remove velocity
        {
            this.resetBall2();
            
          
        }
    
    },

    

});

var sceneWin2 = new Phaser.Class({ // becca: this sets up the new scene and creates a new class for all the scene data to be contained within, with this i can easily add a new level

    Extends: Phaser.Scene, //becca: makes the scene


    initialize: // becca: starts the functions

    function sceneWin () // becca: labels this as sceneWin so it can be called by the other scenes
    {
        Phaser.Scene.call(this, { key: 'sceneWin2' });
    },

    preload: function () //becca: preloading of assets
    {
        this.load.image('Win2', 'assets/games/breakout/Win2.png');
    },

    create: function () // creating the display of assets
    {
        this.add.image(400,300, 'Win2')
        this.input.once('pointerup', function (event){ this.scene.start('breakoutLevel3');}, this);
    },

    update: function()//Becca: functions inside this will update every frame
    {

    }
});

var sceneWin3 = new Phaser.Class({ // becca: this sets up the new scene and creates a new class for all the scene data to be contained within, with this i can easily add a new level

    Extends: Phaser.Scene, //becca: makes the scene


    initialize: // becca: starts the functions

    function sceneWin () // becca: labels this as sceneWin so it can be called by the other scenes
    {
        Phaser.Scene.call(this, { key: 'sceneWin3' });
    },

    preload: function () //becca: preloading of assets
    {
        this.load.image('Win3', 'assets/games/breakout/Win3.png');
    },

    create: function () // creating the display of assets
    {
        this.add.image(400,300, 'Win3')
        this.input.once('pointerup', function (event){ this.scene.start('breakout');}, this);
    },

    update: function()//Becca: functions inside this will update every frame
    {

    }
});

var config = {
    type: Phaser.CANVAS, //Becca: changed ot run on canvas from AUTO, on Auto it will run on either webGL or canvas depending on the browsers capablilites, but as assignement mentions canvas, i put to only run off of canvas to adhere to the breif
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: [ Breakout, sceneWin, sceneLose, BreakoutLevel2, sceneWin2, BreakoutLevel3, sceneWin3 ],
    physics: {
        default: 'arcade'
    },
    audio: { disableWebAudio: true }
};

var game = new Phaser.Game(config);
