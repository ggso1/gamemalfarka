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
var countOfScreens = 2
var worldWidth = 1920 * countOfScreens
let platformsPerScreen = 2;
var game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/fonforest.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude',
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    
}

var platforms;
var movingPlatforms;
function create() {
    this.add.tileSprite(0, 0, worldWidth, 1080, "sky").setOrigin(0, 0);

    // Статичні платформи
    platforms = this.physics.add.staticGroup();
    for (var x = 0; x < worldWidth; x += 128) {
        platforms.create(x, 970, 'ground').setOrigin(0, 0).refreshBody();
    }

    movingPlatforms = this.physics.add.group();

    for (let i = 0; i < 4; i++) {
        let x = Phaser.Math.Between(900, 1000);
        let y = Phaser.Math.Between(500, 900);
        let scale = Phaser.Math.FloatBetween(0.5, 1.5);
    
        let platform = movingPlatforms.create(x, y, 'ground').setScale(scale).refreshBody();
        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true);
        platform.body.setVelocityX(Phaser.Math.Between(50, 150));  // Рух вправо спочатку
        platform.setCollideWorldBounds(true);
    
        // Подія для зміни напрямку руху
        platform.body.onWorldBounds = true;
        platform.body.world.on('worldbounds', function (body) {
            if (body.gameObject === platform) {
                if (body.touching.right || body.touching.left) {  // Перевірка на зіткнення з боками
                    platform.body.setVelocityX(-platform.body.velocity.x);
                }
            }
        });
    }
    
    
    // Гравець
    player = this.physics.add.sprite(200, 450, 'dude');
    player.setBounce(0.5);
    player.setCollideWorldBounds(true);
    

    // Анімації для гравця
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20,
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1,
    });

    // Колайдери для гравця
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, movingPlatforms);

    // Зірки
    stars = this.physics.add.group({
        key: 'star',
        repeat: 20 * countOfScreens,
        setXY: { x: 12, y: 0, stepX: 70 },
    });

    stars.children.iterate(function (child) {
        child.body.setGravityY(Phaser.Math.Between(50, 100));
        child.setBounce(0.7);
    });

    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(stars, movingPlatforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // Бомби
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    // Текст для рахунку
    scoreText = this.add.text(80, 80, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });
    scoreText.setScrollFactor(0);

    // Розширення світу
    this.cameras.main.setBounds(0, 0, worldWidth, 1080);
    this.physics.world.setBounds(0, 0, worldWidth, 1080);

    // Слідкування за гравцем
    this.cameras.main.startFollow(player);

    function collectStar(player, star) {
        star.disableBody(true, true);

        score += 10;
        scoreText.setText('Score: ' + score);

        if (stars.countActive(true) === 0) {
            stars.children.iterate(function (child) {
                let randomX = Phaser.Math.Between(0, worldWidth);
                child.enableBody(true, randomX, 0, true, true);
            });

            let x = Phaser.Math.Between(0, worldWidth);
            let bomb = bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;
        }
    }

    function hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        gameOver = true;
    }
}

function update() {
    cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) {
        player.setVelocityX(-500);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(500);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}
