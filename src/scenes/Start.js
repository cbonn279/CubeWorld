class Start extends Phaser.Scene {
    constructor() { super({ key: 'Start' }); }

    create() {

        // title text
        this.titleText = this.add.text(512, 260, 'Cube World', {
            font: '50px Pixel',
            color: '#000000'
        }).setOrigin(0.5);

        this.startText = this.add.text(512, 360, 'Click to start', {
            font: '18px Pixel',
            color: '#000000'
        }).setOrigin(0.5);

        // blinking
        this.blinkTween = this.tweens.add({
            targets: this.startText,
            alpha: 0,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // click to start
        this.input.once('pointerdown', () => {
            this.intro();
        });
    }

    intro() {
        this.input.enabled = false;

        // remove title text
        if (this.blinkTween) this.blinkTween.stop();
        if (this.titleText) this.titleText.destroy();
        if (this.startText) this.startText.destroy();

        // intro text
        const message = "Remember those toys... I think they were called...";
        const character = 120; 
        const dialog = this.add.text(512, 300, '', {
            font: '26px Pixel',
            color: '#000000',
            align: 'center',
        }).setOrigin(0.5);

        // white screen
        const overlay = this.add.rectangle(512, 360, 1024, 720, 0xffffff)
            .setOrigin(0.5)
            .setAlpha(0);

        // fade trigger
        let fade = message.indexOf("were called...");
        if (fade === -1) {
            fade = Math.floor(message.length * 0.75);
        }
        const fadeSpeed = message.length * character;
        const fadeStart = Math.max(0, fade * character);
        const fadeTime = Math.max(1, fadeSpeed - fadeStart); 

        // intro text typing effect
        let chars = 0;
        const typing = this.time.addEvent({
            delay: character,
            repeat: message.length - 1,
            callback: () => {
                dialog.text += message[chars++];
            }
        });

        // white screen fade
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: fadeTime,
            delay: fadeStart,
            ease: 'Linear',
            onComplete: () => {
                if (typing && !typing.started) {
                    typing.remove(false);
                    dialog.text = message;
                }

                // transition to play
                this.time.delayedCall(1000, () => {
                    this.scene.start('Play');
                });
            }
        });
    }
}
