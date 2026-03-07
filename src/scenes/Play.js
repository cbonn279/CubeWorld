class Play extends Phaser.Scene {
    constructor() { super({ key: 'Play' }); }

    create() {
        // wall
        this.add.image(512, 300, 'wall').setScale(1.8).setOrigin(0.5);

        // table
        this.table = this.physics.add.staticImage(512, 520, 'table').setScale(2).setOrigin(0.5);
        this.table.body.setSize(1000, 500);
        this.table.body.setOffset(-150, 100);

        // blocks
        this.blocks = [];
        const b1 = new Block(this, 360, 300, 'F1', 'stick');
        const b2 = new Block(this, 660, 300, 'F2', 'stick');
        this.blocks.push(b1, b2);

        // collision
        this.blocks.forEach(b => this.physics.add.collider(b, this.table));
        for (let i = 0; i < this.blocks.length; i++) {
            for (let j = i + 1; j < this.blocks.length; j++) {
                this.physics.add.collider(this.blocks[i], this.blocks[j]);
            }
        }

        // flip
        this.input.keyboard.on('keydown-SPACE', () => {
            const held = this.blocks.find(b => b.held);
            if (held) held.flip();
        });

        // debug mode
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setVisible(false);
        this.debugOn = false;

        this.input.keyboard.on('keydown-D', () => {
            this.debugOn = !this.debugOn;
            this.debugGraphics.clear();
            this.debugGraphics.setVisible(this.debugOn);
            this.physics.world.drawDebug = this.debugOn;
            this.physics.world.debugGraphic = this.debugOn ? this.debugGraphics : null;
            if (!this.debugOn) this.debugGraphics.clear();
        });
    }

    update(time, delta) {
        this.blocks.forEach(b => b.update(time, delta));
        if (this.debugOn) this.debugGraphics.clear();
    }
}