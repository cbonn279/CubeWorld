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

        // play music
        this.chill = this.sound.add('chill', { loop: true, volume: 0.05 });
        this.chill.play();

        // click to start
        this.input.once('pointerdown', () => {
            // click sound
            this.sound.play('click', { volume: 0.6 });

            // stop music
            if (this.chill && this.chill.isPlaying) this.chill.stop();

            this.intro();
        });
    }

    intro() {
        this.input.enabled = false;

        // remove title text
        if (this.blinkTween) this.blinkTween.stop();
        if (this.titleText) this.titleText.destroy();
        if (this.startText) this.startText.destroy();

        // typing the text
        const typeText = (textObj, message, charDelay = 40, finish = null, perCharCallback = null) => {
            textObj.text = '';
            let chars = 0;
            const speed = this.time.addEvent({
                delay: charDelay,
                repeat: Math.max(0, message.length - 1),
                callback: () => {
                    const ch = message[chars++];
                    textObj.text += ch;

                    // only play type sound for characters
                    if (/[A-Za-z0-9]/.test(ch)) {
                        this.sound.play('type', { volume: 0.08 });
                    }

                    if (perCharCallback) perCharCallback(ch);

                    if (chars >= message.length && finish) finish();
                }
            });
            return speed;
        };

        // intro text
        const message = "Remember those toys... they were sort of like...";
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
        let fade = message.indexOf("of like...");
        if (fade === -1) {
            fade = Math.floor(message.length * 0.75);
        }
        const fadeSpeed = message.length * character;
        const fadeStart = Math.max(0, fade * character);
        const fadeTime = Math.max(1, fadeSpeed - fadeStart);

        // start typing
        let typing = typeText(dialog, message, character, null);

        // shock sfx
        const shockSfx = this.sound.add('shock', { volume: 0.6 });

        // fade tween
        const overlayTween = this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: fadeTime,
            delay: fadeStart,
            ease: 'Linear',
            onStart: () => {
                shockSfx.play();
            },
            onComplete: () => {
                if (typing) {
                    try {
                        typing.remove(false);
                    } catch (e) {}
                    typing = null;
                    dialog.text = message;
                }

                // wait for sfx 
                if (shockSfx.isPlaying) {
                    shockSfx.once('complete', () => {
                        this.time.delayedCall(0, () => this.scene.start('Play'));
                    });
                } else {
                    this.time.delayedCall(1000, () => this.scene.start('Play'));
                }
            }
        });
    }
}