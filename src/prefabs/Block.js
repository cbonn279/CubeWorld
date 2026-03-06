class Block extends Phaser.GameObjects.Container {
    constructor(scene, x, y, frameKey, screenKey) {
        super(scene, x, y);
        scene.add.existing(this);

        // visuals
        this.frame = scene.add.image(0, 0, frameKey).setOrigin(0.5);
        this.screenContainer = scene.add.container(0, 0);
        this.screen = scene.add.sprite(0, 1, screenKey).setOrigin(0.5);

        this.screenContainer.add(this.screen);
        this.add([ this.frame, this.screenContainer ]);

        this.setScale(3);

        scene.physics.world.enable(this);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.12);

        const bw = this.frame.displayWidth || 32;
        const bh = this.frame.displayHeight || 32;
        this.body.setSize(Math.round(bw * 0.92), Math.round(bh * 0.92));
        this.body.setOffset(-Math.round(bw * 0.46), -Math.round(bh * 0.46));

        this.frame.setInteractive({ useHandCursor: true });

        this.isHeld = false;
        this.pointerOffset = { x: 0, y: 0 };

        this.orientation = 0;

        this._flipListener = null;

        this.stateMachine = new StateMachine('idle', {
            idle: new BlockIdleState(),
            flipping: new BlockFlipState()
        }, [scene, this]);

        this.frame.on('pointerdown', (pointer) => {
            this.pickUp(pointer);
            pointer.event.stopPropagation();
        });

        scene.input.on('pointerup', () => {
            if (this.isHeld) this.drop();
        });
        scene.input.on('pointermove', (pointer) => {
            if (this.isHeld) this.followPointer(pointer);
        });
    }

    update() {
        if (this.stateMachine) this.stateMachine.step();
    }

    requestFlipClockwise() {
        if (!this.isHeld) return;
        if (this.stateMachine.state === 'flipping') return;
        this.stateMachine.transition('flipping', 90);
    }

    pickUp(pointer) {
        if (this.isHeld) return;
        this.isHeld = true;
        if (this.body) this.body.enable = false;
        this.pointerOffset.x = this.x - pointer.worldX;
        this.pointerOffset.y = this.y - pointer.worldY;

        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            y: this.y - 8,
            scale: 3.03,
            duration: 120,
            ease: 'Cubic.easeOut'
        });
    }

    drop() {
        if (!this.isHeld) return;
        this.isHeld = false;
        if (this.body) {
            this.body.enable = true;
            this.body.setVelocity(0, 60);
        }
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            scale: 3,
            duration: 120,
            ease: 'Cubic.easeOut'
        });
    }

    followPointer(pointer) {
        this.x = pointer.worldX + this.pointerOffset.x;
        this.y = pointer.worldY + this.pointerOffset.y;
    }

    playIdle() {
        if (this.screen && this.screen.anims) this.screen.play('Idle1', true);
    }
}


class BlockIdleState extends State {
    enter(scene, block) {
        block.playIdle();
    }
    execute(scene, block) { }
    exit(scene, block) {}
}

class BlockFlipState extends State {
    enter(scene, block, degrees = 90) {
        const newOrient = (block.orientation + degrees) % 360;
        block.orientation = newOrient;

        scene.tweens.killTweensOf(block);
        scene.tweens.killTweensOf(block.screenContainer);

        const outerMs = 200;   
        const flipMs  = 400;   

        scene.tweens.add({
            targets: block,
            angle: newOrient,
            duration: outerMs,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                block.screen.play('Flip', true);

                if (block._flipListener) {
                    block.screen.off('animationcomplete', block._flipListener);
                    block._flipListener = null;
                }

                block._flipListener = function(anim) {
                    if (anim.key === 'Flip') {
                        block.screen.off('animationcomplete', block._flipListener);
                        block._flipListener = null;
                        scene.tweens.killTweensOf(block.screenContainer);
                        block.screenContainer.setAngle(0);
                        block.playIdle();
                        block.stateMachine.transition('idle');
                    }
                };
                block.screen.on('animationcomplete', block._flipListener);

                scene.tweens.add({
                    targets: block.screenContainer,
                    angle: 0,
                    duration: flipMs,
                    ease: 'Cubic.easeIn'
                });
            }
        });
    }
    execute(scene, block) {}
    exit(scene, block) {
        if (block._flipListener) {
            block.screen.off('animationcomplete', block._flipListener);
            block._flipListener = null;
        }
    }
}

// expose
window.Block = Block;
window.BlockIdleState = BlockIdleState;
window.BlockFlipState = BlockFlipState;