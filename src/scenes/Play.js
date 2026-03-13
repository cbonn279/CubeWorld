class Play extends Phaser.Scene {
    constructor() { 
        super({ key: 'Play' }); 
    }

    create() {
        // background music
        this.music = this.sound.add('music', { loop: true, volume: 0.1 });
        this.music.play();

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
        b1.debugId = 'b1';
        b2.debugId = 'b2';

        // table collision
        this.blocks.forEach(b => {
            this.physics.add.collider(b, this.table);
        });

        // block collisions
        for (let i = 0; i < this.blocks.length; i++) {
            for (let j = i + 1; j < this.blocks.length; j++) {
                this.physics.add.collider(
                    this.blocks[i],
                    this.blocks[j],
                    (a, b) => {
                    }
                );
            }
        }

        // flip key
        this.input.keyboard.on('keydown-SPACE', () => {
            const held = this.blocks.find(b => b.held);
            if (held) {
                held.flip();
            }
        });

        // debug
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setVisible(false);
        this.debugOn = false;

        this.input.keyboard.on('keydown-D', () => {
            this.debugOn = !this.debugOn;
            this.debugGraphics.setVisible(this.debugOn);

            if (this.debugOn) {
                this.physics.world.drawDebug = true;
                this.physics.world.debugGraphic = this.debugGraphics;
            } 
            else {
                this.physics.world.drawDebug = false;
                this.physics.world.debugGraphic = null;
                this.debugGraphics.clear();
            }
        });
    }

    update(time, delta) {
        this.blocks.forEach(b => b.update(time, delta));

        if (!this.debugOn) {
            this.debugGraphics.clear();
        }

    }
}