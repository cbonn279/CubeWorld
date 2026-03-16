class Play extends Phaser.Scene {
    constructor() { 
        super({ key: 'Play' }); 
    }

    create() {
        // background music
        this.music = this.sound.add('music', { loop: true, volume: 0.1 });
        this.music.play();

        // garagedoor
        this.add.image(512, 300, 'garagedoor').setScale(1).setOrigin(0.5);

        // floor
        this.floor = this.physics.add.staticImage(300, 765, 'floor').setScale(1.3).setOrigin(0.5);
        this.floor.body.setSize(1000, 500);
        this.floor.body.setOffset(700, 40);

        // blocks 
        this.blocks = [];
        const b1 = new Block(this, 360, 300, 'F1', 'stick');
        const b2 = new Block(this, 660, 300, 'F2', 'stick');
        this.blocks.push(b1, b2);
        b1.debugId = 'b1';
        b2.debugId = 'b2';

        // physics colliders
        this.blocks.forEach(b => { this.physics.add.collider(b, this.floor); });
        for (let i = 0; i < this.blocks.length; i++) {
            for (let j = i + 1; j < this.blocks.length; j++) {
                this.physics.add.collider(this.blocks[i], this.blocks[j], () => {});
            }
        }
        this.input.keyboard.on('keydown-SPACE', () => {
            const held = this.blocks.find(b => b.held);
            if (held) held.flip();
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
            } else {
                this.physics.world.drawDebug = false;
                this.physics.world.debugGraphic = null;
                this.debugGraphics.clear();
            }
        });

        // power flags
        this.power = 'on';
        this.menuOpen = false;

        // create power button
        const btnX = 48;
        const btnY = 48;
        this.powerButton = this.add.image(btnX, btnY, 'On').setOrigin(0.5);
        this.powerButton.setScale(3); 
        this.powerButton.setInteractive({ useHandCursor: true });

        // create black screen
        const configW = this.sys.game.config.width;
        const configH = this.sys.game.config.height;
        this.blackScreen = this.add.rectangle(configW/2, configH/2, configW, configH, 0x000000)
            .setAlpha(0)
            .setDepth(2000);

        // power UI
        this.powerButton.setDepth(this.blackScreen.depth + 1);
        this.powerButton.on('pointerover', () => {
            if (this.power === 'on' && !this.holding()) {
                this.powerButton.setTexture('Onish');
            }
        });
        this.powerButton.on('pointerout', () => {
            if (this.power === 'on') this.powerButton.setTexture('On');
            else this.powerButton.setTexture('Off');
        });
        this.powerButton.on('pointerdown', (pointer) => {
            if (this.power === 'off') return;
            if (this.holding()) return; 
            this.sound.play('click', { volume: 0.6 });
            if (!this.menuOpen) this.Menu();
        });
    }

    update(time, delta) {
        this.blocks.forEach(b => b.update(time, delta));
        if (!this.debugOn) this.debugGraphics.clear();
    }

    holding() { return this.blocks.some(b => b.held); }

    holdable(active) {
        this.blocks.forEach(b => {
            if (!b || !b.frame) return;
            if (active) b.frame.setInteractive({ useHandCursor: true });
            else b.frame.disableInteractive();
        });
    }

    Menu() {
        this.menuOpen = true;
        const configW = this.sys.game.config.width;
        const configH = this.sys.game.config.height;

        // menu overrides
        this.holdable(false);

        // backdrop 
        const backdrop = this.add.rectangle(configW/2, configH/2, configW, configH, 0x000000, 0.5)
            .setOrigin(0.5)
            .setDepth(1500)
            .setInteractive();

        // menu size
        const menuW = Math.round(configW * 0.5);
        const menuH = Math.round(configH * 0.5);
        const menuX = configW/2;
        const menuY = configH/2;

        // menu visuals
        const menuSetting = this.add.rectangle(menuX, menuY, menuW, menuH, 0x889089)
            .setOrigin(0.5)
            .setStrokeStyle(4, 0x2b2b2b)
            .setDepth(1501);

        // menu text
        const menuText = this.add.text(menuX, menuY - menuH*0.22, "Are we done playing?", {
            font: '22px Pixel',
            color: '#000000',
            align: 'center',
            wordWrap: { width: menuW - 40 }
        }).setOrigin(0.5).setDepth(1502);

        const optionY = menuY - menuH*0.02;
        const optionGap = 48;

        // highlight options
        const highlight = this.add.rectangle(0, 0, menuW * 0.7, 40, 0x000000, 0.75)
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(1501);

        // Done option
        const doneText = this.add.text(menuX, optionY + optionGap, "Done", {
            font: '20px Pixel',
            color: '#000000'
        }).setOrigin(0.5).setDepth(1502);
        doneText.setInteractive({ useHandCursor: true });

        // Not Yet option
        const notYetText = this.add.text(menuX, optionY + optionGap*2, "Not Yet", {
            font: '20px Pixel',
            color: '#000000'
        }).setOrigin(0.5).setDepth(1502);
        notYetText.setInteractive({ useHandCursor: true });

        this.menuObjects = { backdrop, menuSetting, menuText, doneText, notYetText, highlight };

        const highlighted = (txt) => {
            txt.setColor('#889089');
            highlight.setPosition(txt.x, txt.y).setVisible(true);
        };
        const normal = (txt) => {
            txt.setColor('#000000');
            highlight.setVisible(false);
        };

        // create options
        doneText.on('pointerover', () => highlighted(doneText));
        doneText.on('pointerout', () => normal(doneText));
        notYetText.on('pointerover', () => highlighted(notYetText));
        notYetText.on('pointerout', () => normal(notYetText));

        notYetText.on('pointerdown', () => {
            this.sound.play('click', { volume: 0.6 });
            this.MenuOff();
        });

        doneText.on('pointerdown', () => {
            this.sound.play('click', { volume: 0.6 });

            this.MenuOff();
            this.power = 'off';
            this.powerButton.setTexture('Off');

            if (this.music && this.music.isPlaying) this.music.stop();

            // black screen fade (play fade.wav and ensure we wait for it if it lasts longer than the visual)
            this.powerButton.setDepth(this.blackScreen.depth + 1);

            const fadeSfx = this.sound.add('fade', { volume: 0.9 });
            fadeSfx.play();

            this.tweens.add({
                targets: this.blackScreen,
                alpha: 1,
                duration: 2000,
                ease: 'Quad.easeInOut',
                onComplete: () => {
                    if (fadeSfx.isPlaying) {
                        fadeSfx.once('complete', () => {
                            // THEN fade the button away
                            this.tweens.add({
                                targets: this.powerButton,
                                alpha: 0,
                                duration: 1200,
                                ease: 'Quad.easeOut',
                                onComplete: () => {
                                    this.scene.start('Message');
                                }
                            });
                        });
                    } else {
                        this.tweens.add({
                            targets: this.powerButton,
                            alpha: 0,
                            duration: 1200,
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                this.scene.start('Message');
                            }
                        });
                    }
                }
            });
        });

    }

    MenuOff() {
        if (!this.menuOpen) return;
        this.menuOpen = false;

        if (this.menuObjects) {
            for (const chars in this.menuObjects) {
                const obj = this.menuObjects[chars];
                if (obj && obj.destroy) obj.destroy();
            }
            this.menuObjects = null;
        }
        this.holdable(true);
    }
}