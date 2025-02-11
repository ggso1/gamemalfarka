var config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
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
var timerText;
var livesText;
var countOfScreens = 2.5;
var worldWidth = 1200 * countOfScreens;
let platformsPerScreen = 2;
var game = new Phaser.Game(config);
var timer = 0;
var lives = 3; 
var timerEvent;

function preload() {
    this.load.image('sky', 'assets/13.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude1.png', { frameWidth: 32, frameHeight: 48 });
}

    function create() {
        this.add.tileSprite(0, 120, worldWidth, 1080, "sky").setOrigin(0, 0);
        this.physics.world.setBounds(0, 0, 800, 600);

        // Статичні платформи
        platforms = this.physics.add.staticGroup();
        for (var x = 0; x < worldWidth; x += 128) {
            platforms.create(x, 1050, 'ground') // змінено з 1000 на 1050
                .setOrigin(0, 0)
                .refreshBody();
        }

        movingPlatforms = this.physics.add.group();

        const yPositions = [800, 900]; // Відстань між платформами

        for (let i = 0; i < 2; i++) {
            let x = Phaser.Math.Between(50, worldWidth - 200);
            let y = yPositions[i];
            let scale = Phaser.Math.FloatBetween(0.5, 0.5);

            let platform = movingPlatforms.create(x, y, 'ground').setScale(scale).refreshBody();
            platform.body.setAllowGravity(false);
            platform.body.setImmovable(true);
            platform.body.setVelocityX(Phaser.Math.Between(-150, 150));
            platform.setCollideWorldBounds(true);

            // Додати умови зміни напрямку
            platform.body.onWorldBounds = true;
            platform.body.world.on('worldbounds', function (body) {
                if (body.gameObject === platform) {
                    if (body.blocked.right || body.blocked.left) {
                        let currentVelocity = platform.body.velocity.x;
                        platform.body.setVelocityX(-Math.sign(currentVelocity) * Math.abs(currentVelocity));
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
            repeat: 16.6 * countOfScreens,
            setXY: { x: 12, y: 0, stepX: 70 },
        });

        stars.children.iterate(function (child) {
            child.body.setGravityY(Phaser.Math.Between(50, 100));
            child.setBounce(0.7);
        });

        this.physics.add.collider(stars, platforms);
        this.physics.add.collider(stars, movingPlatforms, function (star, platform) {
            if (star.body.touching.down) { 
                star.setVelocityX(platform.body.velocity.x); // Робимо зірку рухомою разом із платформою
            }
        });
        
        this.physics.add.overlap(player, stars, collectStar, null, this);

        // Перевірка, щоб зірки не виходили за межі
        stars.children.iterate(function (star) {
            star.setCollideWorldBounds(true); // Перевірка зіткнення з межами світу
            star.body.onWorldBounds = true; // Відслідковування виходу за межі світу

            star.body.world.on('worldbounds', function (body) {
                if (body.gameObject === star) {
                    // Якщо зірка вийшла за межі екрану, скидаємо її
                    if (body.blocked.right || body.blocked.left || body.blocked.down) {
                        star.setPosition(Phaser.Math.Between(0, worldWidth), 0); // Скидаємо зірку
                        star.setVelocityY(Phaser.Math.Between(50, 100)); // Призначаємо нову швидкість
                    }
                }
            });
        });

        // Бомби
        bombs = this.physics.add.group();
        this.physics.add.collider(bombs, platforms);
        this.physics.add.collider(player, bombs, hitBomb, null, this);

        // Текст для рахунку, часу та життів
        
        scoreText = this.add.text(80, 50, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });
        timerText = this.add.text(80, 100, 'Time: 0', { fontSize: '32px', fill: '#ffffff' });
        livesText = this.add.text(80, 150, 'Lives: 3', { fontSize: '32px', fill: '#ffffff' });

        scoreText.setScrollFactor(0);
        timerText.setScrollFactor(0);
        livesText.setScrollFactor(0);

        // Розширення світу
        this.cameras.main.setBounds(0, 0, worldWidth, 1080);
        this.physics.world.setBounds(0, 0, worldWidth, 1080);

        // Слідкування за гравцем
        this.cameras.main.startFollow(player);

        // Таймер оновлення кожну секунду
        timerEvent = this.time.addEvent({
            delay: 1000,
            callback: updateTimer,
            callbackScope: this,
            loop: true,
        });

        function collectStar(player, star) {
            star.disableBody(true, true);

            score += 10;
            scoreText.setText('Score: ' + score);

            // Перевіряємо, чи всі зірки зібрані
            if (stars.countActive(true) === 0) {
                // Оновлюємо зірки
                stars.children.iterate(function (child) {
                    child.enableBody(true, child.x, 0, true, true);
                    child.body.setGravityY(Phaser.Math.Between(50, 100));
                });

                // Додаємо нову бомбу
                let x = Phaser.Math.Between(0, worldWidth);
                let bomb = bombs.create(x, 16, 'bomb');
                bomb.setBounce(1);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
                bomb.allowGravity = false;
            }
        }

        function hitBomb(player, bomb) {
            bomb.disableBody(true, true);

            lives -= 1;
            livesText.setText('Lives: ' + lives);

            if (lives === 0) {
                this.physics.pause();
                player.setTint(0xff0000);
                player.anims.play('turn');
                gameOver = true;
                score = 0;
                timer = 0;
            } else {
                resetPlayer();
            }
        }

        function resetPlayer() {
            player.setPosition(200, 450);
            player.setTint(0xffffff);
        }

        function updateTimer() {
            if (!gameOver) {
                timer++;
                timerText.setText('Time: ' + timer);
            }
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
