// src/scenes/Load.js
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

        this.scene.start('Start');
    }
}