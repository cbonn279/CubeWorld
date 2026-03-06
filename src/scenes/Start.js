class Start extends Phaser.Scene {
    constructor() { super({ key: 'Start' }); }
    create() {
        this.add.text(512, 260, 'Cube World', { font: '24px Arial', color: '#ffffff' }).setOrigin(0.5);
        this.add.text(512, 300, 'Click & drag blocks. Press SPACE to rotate while holding.', { font: '16px Arial', color: '#cccccc' }).setOrigin(0.5);
        this.add.text(512, 360, 'Click to start', { font: '18px Arial', color: '#88ff88' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Play');
        });
    }
}