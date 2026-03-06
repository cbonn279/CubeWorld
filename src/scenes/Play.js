// src/scenes/Play.js
class Play extends Phaser.Scene {
    constructor() { super({ key: 'Play' }); }

    create() {
        // wall and table
        this.add.image(512, 300, 'wall').setOrigin(0.5).setScale(1.8);
        const table = this.physics.add.staticImage(512, 520, 'table').setOrigin(0.5).setScale(2);

        // blocks array
        this.blocks = [];

        const b1 = new Block(this, 360, 300, 'F1', 'stick');
        const b2 = new Block(this, 660, 300, 'F2', 'stick');

        b1.playIdle();
        b2.playIdle();

        this.blocks.push(b1, b2);

        this.blocks.forEach(b => this.physics.add.collider(b, table));

        // SPACE flips held block
        this.input.keyboard.on('keydown-SPACE', () => {
            const held = this.blocks.find(x => x.isHeld);
            if (held) held.requestFlipClockwise();
        });
    }

    update(time, delta) {
        this.blocks.forEach(b => { if (b && b.update) b.update(time, delta); });
    }
}