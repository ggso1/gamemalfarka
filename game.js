var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1000,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var countOfScreens = 1
var worldWidth = 1920 * countOfScreens
var game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/fonfor.webp');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude',
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    
}

var platforms;
function create() {
    // this.add.image(400, 300, 'sky');
    this.add.tileSprite(0,0,worldWidth, 1080, "sky").setOrigin(0,0)
    platforms = this.physics.add.staticGroup();
    

    // platforms.create(0, 940, 'ground')
    // .setOrigin(0, 0)
    // // .setScale(worldWidth / 128, 2)
    // .refreshBody();
    for (var x = 0; x < worldWidth; x = x + 128) {
        platforms.create(x, 950, 'ground').setOrigin(0, 0).refreshBody(); // Зміщення платформи вниз
    }
    


    player = this.physics.add.sprite(100, 450, 'dude');

player.setBounce(0.2);
player.setCollideWorldBounds(true);

this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
});

this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
});

this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
});

this.physics.add.collider(player, platforms);
stars = this.physics.add.group({
    key: 'star',
    repeat: 20 * countOfScreens,
    setXY: { x: 12, y: 0, stepX: 70 }
});

stars.children.iterate(function (child) {
    child.body.setGravityY(Phaser.Math.Between(50, 100)); // Додаємо гравітацію для кожної зірочки
    child.setBounce(0.7); // Встановлюємо коефіцієнт відскоку
});
this.physics.add.collider(stars, platforms);
this.physics.add.overlap(player, stars, collectStar, null, this);
function collectStar (player, star)
{
    star.disableBody(true, true);
    
}
scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '10px', fill: '#000' });

bombs = this.physics.add.group();

scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

this.physics.add.collider(player, platforms);
this.physics.add.collider(stars, platforms);
this.physics.add.collider(bombs, platforms);

this.physics.add.overlap(player, stars, collectStar, null, this);

this.physics.add.collider(player, bombs, hitBomb, null, this);


stars.children.iterate(function (child) {
    // Встановлюємо випадкову координату x для зірочки
    var randomX = Phaser.Math.Between(0, worldWidth); 
    child.enableBody(true, randomX, 0, true, true);
});

function collectStar(player, star) {
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
    var randomX = Phaser.Math.Between(0, worldWidth); // Використовуємо ширину світу
    child.enableBody(true, randomX, 0, true, true);
});

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}


function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}

this.cameras.main.setBounds(0, 0, 4000, 1080);
this.physics.world.setBounds(0, 0, 4000, 1080);

this.cameras.main.startFollow(player);



}



    function update() {
        cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown)
            {
                player.setVelocityX(-500);
            
                player.anims.play('left', true);
            }
            else if (cursors.right.isDown)
            {
                player.setVelocityX(500);
            
                player.anims.play('right', true);
            }
            else
            {
                player.setVelocityX(0);
            
                player.anims.play('turn');
            }
            
            if (cursors.up.isDown && player.body.touching.down)
            {
                player.setVelocityY(-330);
            }

    }