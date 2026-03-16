class Message extends Phaser.Scene {
    constructor() { super({ key: 'Message' }); }

    create() {

        // config vars
        const configW = this.sys.game.config.width;
        const configH = this.sys.game.config.height;
        const configX = configW / 2;
        const configY = configH / 2;

        // black screen
        const black = this.add.rectangle(configX, configY, configW, configH, 0x000000)
            .setOrigin(0.5)
            .setDepth(1000)
            .setAlpha(1);

        // mail icon
        this.mail = this.add.image(configX, configY, 'mail')
            .setOrigin(0.5)
            .setDepth(900)
            .setScale(15);

        // title text
        const titleY = configY - (this.mail.displayHeight * 0.5) - 40;
        this.titleText = this.add.text(configX, titleY, '', {
            font: '26px Pixel',
            color: '#000000',
            align: 'center',
            wordWrap: { width: Math.round(configW * 0.8) }
        }).setOrigin(0.5).setDepth(1001);

        // click text
        const clickY = configY + (this.mail.displayHeight * 0.5) + 24; 
        this.clickText = this.add.text(configX, clickY, '', {
            font: '18px Pixel',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        // play notif 
        this.sound.play('notif', { volume: 0.9 });

        // typing function 
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

        // black screen fade
        const fading = 1200;
        this.tweens.add({
            targets: black,
            alpha: 0,
            duration: fading,
            ease: 'Quad.easeOut',
            onComplete: () => {

                const firstLine = "you got mail...";
                const mailSfx = this.sound.add('mail', { volume: 0.9 });

                // start typing
                mailSfx.play();
                typeText(this.titleText, firstLine, 60, () => {
                    this.clickText.text = 'Click to Open';
                    this.clickText.setAlpha(1);
                    this.clickBlink = this.tweens.add({
                        targets: this.clickText,
                        alpha: 0,
                        duration: 600,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });

                    // wait for click 
                    this.input.once('pointerdown', () => {
                        // click sound and music play
                        this.sound.play('click', { volume: 0.6 });
                        this.chill = this.sound.add('chill', { loop: true, volume: 0.05 });
                        this.chill.play();
                        if (this.clickBlink) this.clickBlink.stop();
                        this.titleText.destroy();
                        this.clickText.destroy();

                        // shrink and tween mail icon
                        const shrink = 3;
                        const mailX = configX;
                        const mailY = configH * 0.78;

                        this.tweens.add({
                            targets: this.mail,
                            x: mailX,
                            y: mailY,
                            scale: shrink,
                            duration: 450,
                            ease: 'Cubic.easeInOut',
                            onComplete: () => {
                                this.mail.setTexture('mailOpen');
                                const message =
`Gina... Thank you for playing my games...

I work hard and the most exciting part is watching
you play them...

You're the best sister ever...


From
Your favorite brother...
`;

                                // place message text
                                const textY = configH * 0.18;
                                this.messageText = this.add.text(configX, textY, '', {
                                    font: '20px Pixel',
                                    color: '#000000',
                                    align: 'center',
                                    lineSpacing: 30, 
                                    wordWrap: { width: Math.round(configW * 0.8) }
                                })
                                .setOrigin(0.5, 0)
                                .setDepth(1001);

                                // type final message
                                typeText(this.messageText, message, 100, () => {
                                });
                            }
                        });
                    });
                });
            }
        });
    }
}