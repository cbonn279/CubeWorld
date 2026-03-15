class Message extends Phaser.Scene {
    constructor() { super({ key: 'Message' }); }

    create() {
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

        // typing function
        const typeText = (textObj, message, charDelay = 40, finish = null) => {
            textObj.text = '';
            let chars = 0;
            const speed = this.time.addEvent({
                delay: charDelay,
                repeat: message.length - 1,
                callback: () => {
                    textObj.text += message[chars++] ;
                    if (chars >= message.length && finish) finish();
                }
            });
            return speed;
        };

        // black screen fade out
        const fading = 1200;
        this.tweens.add({
            targets: black,
            alpha: 0,
            duration: fading,
            ease: 'Quad.easeOut',

            // after fade type text
            finish: () => {
                const firstLine = "you got mail...";
                typeText(this.titleText, firstLine, 60, () => {

                    // blinking text
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

                    // clear text when clicked
                    this.input.once('pointerdown', () => {
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
                            finish: () => {

                                const message = 
`Gina... Thank you for playing my games...
I work hard and the most exciting part is watching 
you play them...
Your the best sister ever...

      From
Your favorite brother...`;

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

                                // type message
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
