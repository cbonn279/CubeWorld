class Load extends Phaser.Scene {
    constructor() { super({ key: 'Load' }); }

    preload() {
        // images
        this.load.image('F1', 'assets/frame1.png');
        this.load.image('F2', 'assets/frame2.png');
        this.load.image('table', 'assets/table.png');
        this.load.image('wall', 'assets/wall.jpg');

        this.load.spritesheet('stick', 'assets/Stickman.png', {
             frameWidth: 36, 
             frameHeight: 36 
            });

        // audio
        this.load.audio('drop', 'assets/drop.wav');
        this.load.audio('flip', 'assets/flip.wav');
        this.load.audio('snap', 'assets/snap.wav');
        this.load.audio('unsnap', 'assets/unsnap.wav');
        this.load.audio('music', 'assets/music.mp3');
    }

    create() {
         // animations
        this.anims.create({
            key: 'Idle1',
            frameRate: 1,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('stick', { start: 0, end: 0 }),
        })
        this.anims.create({
            key: 'Idle2',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 1, end: 4 }),
            yoyo: true,
        })
        this.anims.create({
            key: 'Flip',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 5, end: 15 }),
        })
        this.anims.create({
            key: 'WaveR',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 16, end: 24 }),
        })
        this.anims.create({
            key: 'WaveL',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 25, end: 33 }),
        })
        this.anims.create({
            key: 'LeaveR',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 34, end: 47 }),
        })
        this.anims.create({
            key: 'Close',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 48, end: 56 }),
        })
        this.anims.create({
            key: 'Closed',
            frameRate: 6,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('stick', { start: 56, end: 56 }),
        })
        this.anims.create({
            key: 'Open',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 56, end: 64 }),
        })
        this.anims.create({
            key: 'ArriveL',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 65, end: 73 }),
        })
        this.anims.create({
            key: 'LeaveL',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 73, end: 79 }),
        })
        this.anims.create({
            key: 'ArriveR',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 80, end: 85 }),
        })
        this.anims.create({
            key: 'LeaveU',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 86, end: 94 }),
        })
        this.anims.create({
            key: 'ArriveD',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 95, end: 106 }),
        })
        this.anims.create({
            key: 'IdleT',
            frameRate: 6,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('stick', { start: 106, end: 106 }),
        })
        this.anims.create({
            key: 'LeaveD',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 107, end: 114 }),
        })
        this.anims.create({
            key: 'ArriveU',
            frameRate: 6,
            repeat: 0,
            frames: this.anims.generateFrameNumbers('stick', { start: 115, end: 122 }),
        })

        this.scene.start('Start');
    }
}