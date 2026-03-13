class Block extends Phaser.GameObjects.Container {
    constructor(scene, x, y, frameKey, screenKey, Hitbox = {}) {
        super(scene, x, y);
        scene.add.existing(this);

        // vars
        this.landed = false;
        this.touchSide = null;
        this.snapped = false;
        this.snapPartner = null;
        this.snapping = null;
        this.isSnapMover = false;
        this.snapOffset = {
            left:  { x: 35, y: 30 },
            right: { x: 35,  y: 30 },
            up:    { x: 0,   y: 0 },
            down:  { x: 37,   y: 30 }
        };

        // create block container
        this.frame = scene.add.image(0, 0, frameKey).setOrigin(0.5);
        this.screen = scene.add.sprite(0, 0, screenKey).setOrigin(0.5);
        this.add([ this.frame, this.screen ]);
        this.setScale(3);

        // physics
        const sceneW = Math.round(this.frame.displayWidth);
        const sceneH = Math.round(this.frame.displayHeight);
        this.Scene = scene.add.zone(x, y, sceneW, sceneH);
        scene.physics.world.enable(this.Scene);
        this.body = this.Scene.body;

        // physics vars
        this.body.setCollideWorldBounds(true);
        this.body.setFrictionX(1);
        this.body.setBounce(0);
        this.body.setDragX(600);
        this.body.setDamping(true);
        this.body.setMaxVelocity(1000, 2000);

        // hitbox
        const hitboxes = {
            boxW: Hitbox.boxW ?? 2.8,
            boxH: Hitbox.boxH ?? 2.8,
            offsetW: Hitbox.offsetW ?? 0,
            offsetH: Hitbox.offsetH ?? 0
        };
        const hitW = Math.round(sceneW * hitboxes.boxW);
        const hitH = Math.round(sceneH * hitboxes.boxH);
        const offX = Math.round(sceneW * hitboxes.offsetW);
        const offY = Math.round(sceneH * hitboxes.offsetH);
        this.body.setSize(hitW, hitH);
        this.body.setOffset(offX, offY);

        // dragging vars
        this.dragSpeed = 10;
        this.dragMaxSpeed = 1200;
        this.dragDamp = 800;
        this.dragOffset = { x: 0, y: 0 };
        this.frame.setInteractive({ useHandCursor: true });
        this.held = false;

        // movement check
        this.prev = { x: 0, y: 0 };
        this.static = 2;

        // state & direction
        this.sideDown = 0;
        this.stateMachine = new StateMachine('idle', {
            idle: new BlockIdleState(),
            flip: new BlockFlipState(),
            snap: new BlockSnapState(),
        }, [scene, this]);

        // magnets
        this.magnetCreate(scene, sceneW, sceneH);

        // pointer logic
        this.frame.on('pointerdown', (pointer) => this.pickUp(pointer));
        scene.input.on('pointerup', () => { if (this.held) this.drop(); });
        scene.input.on('pointermove', (pointer) => { if (this.held) this.drag(pointer); });
        this.bodyFollow();
    }

    magnetCreate(scene, sceneW, sceneH) {
        // sizings
        const magnetOffset = 60;
        const horW = Math.round(sceneW * 0.18);
        const horH = Math.round(sceneH * 0.62);
        const verW = Math.round(sceneW * 0.62);
        const verH = Math.round(sceneH * 0.18);
        const halfW = sceneW * 0.5;
        const halfH = sceneH * 0.5;

        this.magnets = {
            left:  { 
                w: horW, 
                h: horH,  
                offx: -Math.round(halfW + horW * 0.5 + magnetOffset), 
                offy: 0 
            },

            right: { 
                w: horW, 
                h: horH,  
                offx:  Math.round(halfW + horW * 0.5 + magnetOffset), 
                offy: 0 
            },

            up: {    
                w: verW, 
                h: verH,  
                offx: 0, 
                offy: -Math.round(halfH + verH * 0.5 + magnetOffset) 
            },

            down: {  
                w: verW, 
                h: verH,  
                offx: 0, 
                offy:  Math.round(halfH + verH * 0.5 + magnetOffset) 
            },
        };

        // create each
        this.magnetZones = {};
        this.magnetVisuals = {};  
        for (const side of ['left','right','up','down']) {
            const m = this.magnets[side];

            // create zone
            const zone = scene.add.zone(this.x + m.offx, this.y + m.offy, m.w, m.h);
            scene.physics.world.enable(zone);
            zone.body.setAllowGravity(false);
            zone.body.setImmovable(true);
            zone.myBlock = this;
            zone.sidez = side;

            if (!scene.magnetGroup) scene.magnetGroup = scene.physics.add.group();
            scene.magnetGroup.add(zone);
            this.magnetZones[side] = zone;

            // create visual
            const magx = Math.round(this.x + m.offx);
            const magy = Math.round(this.y + m.offy);
            const vis = scene.add.rectangle(magx, magy, m.w, m.h, 0xff00ff, 0.0)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x00ff00)
                .setVisible(scene.debugOn)
                .setDepth(1000);
            this.magnetVisuals[side] = vis;
        }

        // check magnet collisions per side
        if (!scene.magnetCollision) {
            scene.physics.add.overlap(
                scene.magnetGroup,
                scene.magnetGroup,
                (BA, BB) => {
                    if (!BA || !BB || BA === BB) return;
                    if (BA.myBlock === BB.myBlock) return;
                    const A = BA.myBlock;
                    const B = BB.myBlock;
                    const sideA = BA.sidez;
                    const sideB = BB.sidez;

                    if (
                        (sideA === 'left'  && sideB === 'right') ||
                        (sideA === 'right' && sideB === 'left')  ||
                        (sideA === 'up'    && sideB === 'down')  ||
                        (sideA === 'down'  && sideB === 'up')
                    ){
                        A.touchSide = sideA;
                        B.touchSide = sideB;
                        if (!A.held && !B.held && !A.snapped && !B.snapped) {
                            A.snapping = B;
                            B.snapping = A;
                        }
                    }
                }
            );
            scene.magnetCollision = true;
        }
    }

    magnetCoords(side) {
        const m = this.magnets[side];
        if (!m) return { x: this.x, y: this.y };
        return { x: Math.round(this.x + m.offx), y: Math.round(this.y + m.offy) };
    }

    magnetAdd(side) {
        const m = this.magnets[side];
        // center of mags
        const worldX = this.x + m.offx;
        const worldY = this.y + m.offy;
        const x = Math.round(worldX - (m.w / 2));
        const y = Math.round(worldY - (m.h / 2));
        return new Phaser.Geom.Rectangle(x, y, m.w, m.h);
    }

    update(time, delta) {
        this.stateMachine.step();

        // dragging input
        if (this.held) {
            const active = this.scene.input.activePointer;
            this.drag(active);
        }
        this.bodyFollow();

        for (const side of ['left','right','up','down']) {
            const m = this.magnets[side];
            const zone = this.magnetZones[side];
            const vis = this.magnetVisuals[side];

            if (!zone) continue;

            // world position for mag zone
            const magx = Math.round(this.x + m.offx);
            const magy = Math.round(this.y + m.offy);
            zone.setPosition(magx, magy);

            // update mag body
            if (zone.body) {
                zone.body.x = magx - (zone.width / 2);
                zone.body.y = magy - (zone.height / 2);
                if (zone.body.updateFromGameObject) zone.body.updateFromGameObject();
            }

            // update visual
            if (vis) {
                vis.setPosition(magx, magy);
                vis.setVisible(this.scene.debugOn);
            }
        }

        // drop sound
        if (!this.held && this.body.blocked.down) {
            if (!this.landed) {
                this.scene.sound.play('drop', { volume: 1 });
                this.landed = true;
            }
            this.body.setVelocityX(0);
        }
    }

    unsnap() {
         if (!this.snapped) return;

        this.scene.sound.play('unsnap', { volume: 0.4 });

        const partner = this.snapPartner;

        // restore vars/physics
        const restore = (b) => {
            if (!b) return;
            b.snapped = false;
            b.snapPartner = null;
            b.snapping = null;
            b.isSnapMover = false;

            if (b.body) {
                b.body.setImmovable(false);
                b.body.setAllowGravity(true);
                b.body.setVelocity(0,0);
            }

            if (b.stateMachine && b.stateMachine.state !== 'idle') {
                b.stateMachine.transition('idle');
            }
        };
        restore(this);
        restore(partner);
    }

    pickUp(pointer) {
        if (this.held) return;
        if (this.snapped && this.snapPartner) {
            this.unsnap();
        }

        this.held = true;
        this.landed = false;

        this.dragOffset.x = this.x - pointer.worldX;
        this.dragOffset.y = this.y - pointer.worldY;

        this.prev.x = pointer.worldX;
        this.prev.y = pointer.worldY;
        this.body.setAllowGravity(false);
        this.body.setVelocity(0, 0);
        this.body.setDrag(this.dragDamp);

        if (this.snapping) {
            const other = this.snapping;
            this.snapping = null;
            if (other && other.snapping === this) other.snapping = null;
        }
    }

    drag(pointer) {
        if (!this.held) return;

        const targetX = pointer.worldX + this.dragOffset.x;
        const targetY = pointer.worldY + this.dragOffset.y;
        const centerX = this.body.position.x + (this.body.width * 0.5) + (this.body.offset.x);
        const centerY = this.body.position.y + (this.body.height * 0.5) + (this.body.offset.y);

        const moved = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.prev.x, this.prev.y);

        const bodyLeft = this.body.position.x + (this.body.offset ? this.body.offset.x : 0);
        const bodyTop  = this.body.position.y + (this.body.offset ? this.body.offset.y : 0);
        const bodyRight = bodyLeft + this.body.width;
        const bodyBottom = bodyTop + this.body.height;

        const pointerInsideBody =
            pointer.worldX >= bodyLeft &&
            pointer.worldX <= bodyRight &&
            pointer.worldY >= bodyTop &&
            pointer.worldY <= bodyBottom;

        if (moved <= this.static && pointerInsideBody) {
            this.body.setVelocity(0, 0);
            this.body.setAllowGravity(false);
            return;
        }

        if (moved > this.static) {
            this.prev.x = pointer.worldX;
            this.prev.y = pointer.worldY;
        }

        const deltaX = targetX - centerX;
        const deltaY = targetY - centerY;
        const velocityX = Phaser.Math.Clamp(deltaX * this.dragSpeed, -this.dragMaxSpeed, this.dragMaxSpeed);
        const velocityY = Phaser.Math.Clamp(deltaY * this.dragSpeed, -this.dragMaxSpeed, this.dragMaxSpeed);

        if (this.body.blocked.left && velocityX < 0) this.body.setVelocityX(0); else this.body.setVelocityX(velocityX);
        if (this.body.blocked.up && velocityY < 0) this.body.setVelocityY(0); else this.body.setVelocityY(velocityY);
        if (this.body.blocked.right && velocityX > 0) this.body.setVelocityX(0);
        if (this.body.blocked.down && velocityY > 0) this.body.setVelocityY(0);
    }

    drop() {
        if (!this.held) return;
        this.held = false;
        this.snapping = null;
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

    execute(scene, block) {
        const other = block.snapping;
        if (!other) return;

        if (block.held || other.held) {
            block.snapping = null;
            other.snapping = null;
            return;
        }

        if (!block.touchSide || !other.touchSide) {
            block.snapping = null;
            return;
        }

        if (block.snapped || other.snapped) {
            block.snapping = null;
            return;
        }

        const pair = `${block.touchSide}:${other.touchSide}`;
        const horizontalPairs = new Set(['left:right', 'right:left']);
        const verticalPairs = new Set(['up:down', 'down:up']);

        let axis = null;
        if (horizontalPairs.has(pair)) axis = 'h';
        if (verticalPairs.has(pair)) axis = 'v';
        if (!axis) return;

        // higher block moves
        let mover, stationary;
        if (block.y < other.y) {
            mover = block;
            stationary = other;
        } else {
            mover = other;
            stationary = block;
        }

        if (!mover || !stationary) return;
        const moverSide = mover.touchSide;
        const statSide  = stationary.touchSide;
        const moverMag = mover.magnetCoords(moverSide);
        const statMag  = stationary.magnetCoords(statSide);
        const moverOffset = mover.snapOffset[moverSide] || {x:0,y:0};
        const dx = (statMag.x + moverOffset.x) - moverMag.x;
        const dy = (statMag.y + moverOffset.y) - moverMag.y;

        // connect blocks
        mover.snapAlign = { dx, dy };
        mover.snapPartner = stationary;
        stationary.snapPartner = mover;

        mover.isSnapMover = true;
        stationary.isSnapMover = false;
        mover.snapping = null;
        stationary.snapping = null;
        
        // state switch
        const stateName = 'snap';
        if (!stateName) return;
        mover.stateMachine.transition(stateName);
        stationary.stateMachine.transition(stateName);
    }

    exit(scene, block) {
        if (block.idleTimer) { block.idleTimer.remove(); block.idleTimer = null; }
    }
}

class BlockFlipState extends State {
    enter(scene, block) {
        scene.sound.play('flip', { volume: 0.4 });

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

class BlockSnapState extends State {

    enter(scene, block) {

        const other = block.snapPartner;

        if (!other || !other.body) {
            block.stateMachine.transition('idle');
            return;
        }

        const body = block.body;

        if (block.isSnapMover && block.snapAlign) {

            const dx = block.snapAlign.dx;
            const dy = block.snapAlign.dy;

            const targetX = body.position.x + dx;
            const targetY = body.position.y + dy;

            body.reset(
                Math.round(targetX),
                Math.round(targetY)
            );
            block.snapAlign = null;

        }

        body.setVelocity(0,0);
        body.setImmovable(true);
        body.setAllowGravity(false);

        block.snapped = true;
        if (block.isSnapMover) {
            scene.sound.play('snap', { volume: 0.2 });
        }
    }

    execute(scene, block) {

        if (!block.snapPartner || !block.snapped) {
            block.stateMachine.transition('idle');
            return;
        }

        block.body.setVelocity(0,0);
        block.body.setAllowGravity(false);
        block.body.setImmovable(true);
    }
}