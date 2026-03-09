class Block extends Phaser.GameObjects.Container {
    constructor(scene, x, y, frameKey, screenKey, Hitbox = {}) {
        super(scene, x, y);
        scene.add.existing(this);
        this.landed = false;

        // combine frame and screen
        this.frame = scene.add.image(0, 0, frameKey).setOrigin(0.5);
        this.screen = scene.add.sprite(0, 1, screenKey).setOrigin(0.5); 
        this.add([ this.frame, this.screen ]);
        this.setScale(3);

        // physics in scene
        const sceneW = Math.round(this.frame.displayWidth);
        const sceneH = Math.round(this.frame.displayHeight);
        this.Scene = scene.add.zone(x, y, sceneW, sceneH);
        scene.physics.world.enable(this.Scene);
        this.body = this.Scene.body;

        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.1);

        // hitboxes
        const hitboxes = {
            boxW: Hitbox.boxW ?? 1.89,
            boxH: Hitbox.boxH ?? 1.89,
            offsetW: Hitbox.offsetW ?? 0,
            offsetH: Hitbox.offsetH ?? 0
        };

        const hitW = Math.round(sceneW * hitboxes.boxW);
        const hitH = Math.round(sceneH * hitboxes.boxH);
        const offX = Math.round(sceneW * hitboxes.offsetW);
        const offY = Math.round(sceneH * hitboxes.offsetH);

        this.body.setSize(hitW, hitH);
        this.body.setOffset(offX, offY);

        // dragging
        this.dragSpeed = 10;
        this.dragMaxSpeed = 1200;
        this.dragDamping = 800;
        this.dragOffset = { x: 0, y: 0 };
        this.frame.setInteractive({ useHandCursor: true });
        this.held = false;

        // block direction
        this.sideDown = 0;

        // state machine
        this.stateMachine = new StateMachine('idle', {
            idle: new BlockIdleState(),
            flip: new BlockFlipState()
        }, [scene, this]);

        // pointer logic
        this.frame.on('pointerdown', (pointer) => this.pickUp(pointer));
        scene.input.on('pointerup', () => { if (this.held) this.drop(); });
        scene.input.on('pointermove', (pointer) => { if (this.held) this.drag(pointer); });

        // body following
        this.bodyFollow();
    }

    update(time, delta) {
        this.stateMachine.step();
        this.bodyFollow();

        if (!this.held && this.body.blocked.down) {
            if (!this.landed) {
                this.scene.sound.play('drop', { volume: 1 });
                this.landed = true;
            }
            this.body.setVelocity(0, 0);
            this.body.setAllowGravity(false);
            this.body.setImmovable(true);
        }
    }

    pickUp(pointer) {
        if (this.held) return;
        this.held = true;
        this.landed = false;

        // draggability
        this.dragOffset.x = this.x - pointer.worldX;
        this.dragOffset.y = this.y - pointer.worldY;
        this.body.setImmovable(false);
        this.body.setAllowGravity(false);
        this.body.setVelocity(0, 0);
        this.body.setDrag(this.dragDamping);
    }

    drag(pointer) {
        if (!this.held) return;

        // body movement
        const targetX = pointer.worldX + this.dragOffset.x;
        const targetY = pointer.worldY + this.dragOffset.y;
        const centerX = this.body.position.x + (this.body.width * 0.5) + this.body.offset.x;
        const centerY = this.body.position.y + (this.body.height * 0.5) + this.body.offset.y;

        // delta
        const deltaX = targetX - centerX;
        const deltaY = targetY - centerY;
        const velocityX = Phaser.Math.Clamp(deltaX * this.dragSpeed, -this.dragMaxSpeed, this.dragMaxSpeed);
        const velocityY = Phaser.Math.Clamp(deltaY * this.dragSpeed, -this.dragMaxSpeed, this.dragMaxSpeed);

        // collision
        if (this.body.blocked.left && velocityX < 0) this.body.setVelocityX(0); else this.body.setVelocityX(velocityX);
        if (this.body.blocked.up && velocityY < 0) this.body.setVelocityY(0);    else this.body.setVelocityY(velocityY);
        if (this.body.blocked.right && velocityX > 0) this.body.setVelocityX(0);
        if (this.body.blocked.down && velocityY > 0) this.body.setVelocityY(0);
    }

    drop() {
        if (!this.held) return;
        this.held = false;
        this.body.setImmovable(false);
        this.body.setAllowGravity(true);
        this.body.setVelocity(0, 0);
        this.body.setDrag(0);
    }

    flip() {
        if (!this.held) return;
        this.stateMachine.transition('flip');
    }

    bodyFollow() {
        const centerX = this.body.position.x + (this.body.width * 0.5) + this.body.offset.x;
        const centerY = this.body.position.y + (this.body.height * 0.5) + this.body.offset.y;
        this.x = centerX;
        this.y = centerY;
    }
}

class BlockIdleState extends State {
    enter(scene, block) {

        block.screen.play('Idle1', true);

        // idle2 timer 
        if (block.idleTimer) { block.idleTimer.remove(); block.idleTimer = null; }
        block.idleTimer = scene.time.addEvent({
            delay: 10000,
            loop: true,
            callback: () => {
                if (block.stateMachine.state === 'idle') {
                    block.screen.play('Idle2');
                    block.screen.once('animationcomplete', () => {
                        block.screen.play('Idle1', true);
                    });
                }
            }
        });
    }
    execute(scene, block) {}
    exit(scene, block) {
        if (block.idleTimer) { block.idleTimer.remove(); block.idleTimer = null; }
    }
}

class BlockFlipState extends State {
    enter(scene, block) {
        scene.sound.play('flip', { volume: 0.1 });

        // rotate frame w/out screen
        block.angle -= 90;
        block.screen.angle += 90;

        block.sideDown = (block.sideDown + 1) % 4;
        block.screen.play('Flip');
        block.screen.once('animationcomplete', () => this.stateMachine.transition('idle'));
    }
    execute(scene, block) {}
    exit(scene, block) {}
}