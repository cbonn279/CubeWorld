// consts
const SIDES = ['left','right','up','down'];
const HORIZONTALS = new Set(['left:right','right:left']);
const VERTICALS = new Set(['up:down','down:up']);

function clearTimer(timer) {
    if (timer) timer.remove(false);
    return null;
}

class Block extends Phaser.GameObjects.Container {
    constructor(scene, x, y, frameKey, screenKey, Hitbox = {}) {
        super(scene, x, y);
        scene.add.existing(this);

        // big boy vars
        this.landed = false;
        this.animCycle = false; 
        this.touchSide = null;

        // snap vars
        this.snapped = false;
        this.snapPartner = null;
        this.snapping = null;
        this.mover = false;
        this.snapOffset = {
            left:  { x: 35,  y: 30 },
            right: { x: 35,  y: 30 },
            up:    { x: 0,  y: 0 },
            down:  { x: 37, y: 30 }
        };

        // visit vars
        this.visit = {
            role: null, 
            active: false,
            partner: null,
            axis: null,
            phase: 0,
            timer: null,
            checkTimer: null,
            returning: false
        };

        // block creation
        this.frame = scene.add.image(0, 0, frameKey).setOrigin(0.5);
        this.screen = scene.add.sprite(0, 0, screenKey).setOrigin(0.5);
        this.add([ this.frame, this.screen ]);
        this.setScale(3);

        // physics body
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

        // hitboxes
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

        // dragging
        this.dragSpeed = 10;
        this.dragMaxSpeed = 1200;
        this.dragDamp = 800;
        this.dragOffset = { x: 0, y: 0 };
        this.frame.setInteractive({ useHandCursor: true });
        this.held = false;

        // movement check
        this.prev = { x: 0, y: 0 };
        this.static = 2;

        // state machine
        this.sideDown = 0;
        this.stateMachine = new StateMachine('idle', {
            idle: new BlockIdleState(),
            flip: new BlockFlipState(),
            snap: new BlockSnapState(),
            visit: new BlockVisitState(),
            host: new BlockHostState(),
        }, [scene, this]);

        // create magnets
        this.magnetCreate(scene, sceneW, sceneH);

        // pointer logic
        this.frame.on('pointerdown', (pointer) => this.pickUp(pointer));
        scene.input.on('pointerup', () => { if (this.held) this.drop(); });
        scene.input.on('pointermove', (pointer) => { if (this.held) this.drag(pointer); });
        this.bodyFollow();
    }

    magnetCreate(scene, sceneW, sceneH) {
        // magnet vars
        const magnetOffset = 60;
        const horW = Math.round(sceneW * 0.18);
        const horH = Math.round(sceneH * 0.62);
        const verW = Math.round(sceneW * 0.62);
        const verH = Math.round(sceneH * 0.18);
        const halfW = sceneW * 0.5;
        const halfH = sceneH * 0.5;

        // magnet sizing
        this.magnets = {
            left: { w: horW, h: horH, offx: -Math.round(halfW + horW * 0.5 + magnetOffset), offy: 0 },
            right: { w: horW, h: horH, offx:  Math.round(halfW + horW * 0.5 + magnetOffset), offy: 0 },
            up: { w: verW, h: verH, offx: 0, offy: -Math.round(halfH + verH * 0.5 + magnetOffset) },
            down: { w: verW, h: verH, offx: 0, offy:  Math.round(halfH + verH * 0.5 + magnetOffset) },
        };

        // magnet placement
        this.magnetZones = {};
        this.magnetVisuals = {};
        for (const side of SIDES) {
            const m = this.magnets[side];
            const zone = scene.add.zone(this.x + m.offx, this.y + m.offy, m.w, m.h);
            scene.physics.world.enable(zone);
            zone.body.setAllowGravity(false);
            zone.body.setImmovable(true);
            zone.myBlock = this;
            zone.sidez = side;

            if (!scene.magnetGroup) scene.magnetGroup = scene.physics.add.group();
            scene.magnetGroup.add(zone);
            this.magnetZones[side] = zone;

            // magnet visability
            const magx = Math.round(this.x + m.offx);
            const magy = Math.round(this.y + m.offy);
            const vis = scene.add.rectangle(magx, magy, m.w, m.h, 0xff00ff, 0.0)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x00ff00)
                .setVisible(scene.debugOn)
                .setDepth(1000);
            this.magnetVisuals[side] = vis;
        }

        // magnet collisions
        if (!scene.magnetCollision) {
            scene.physics.add.overlap(
                scene.magnetGroup,
                scene.magnetGroup,
                (block1, block2) => {
                    if (!block1 || !block2 || block1 === block2) return;
                    if (block1.myBlock === block2.myBlock) return;
                    const mag1 = block1.myBlock;
                    const mag2 = block2.myBlock;
                    const sideA = block1.sidez;
                    const sideB = block2.sidez;

                    if (
                        (sideA === 'left'  && sideB === 'right') ||
                        (sideA === 'right' && sideB === 'left')  ||
                        (sideA === 'up'    && sideB === 'down')  ||
                        (sideA === 'down'  && sideB === 'up')
                    ){
                        mag1.touchSide = sideA;
                        mag2.touchSide = sideB;
                        
                        if (!mag1.held && !mag2.held && !mag1.snapped && !mag2.snapped) {
                            mag1.snapping = mag2;
                            mag2.snapping = mag1;
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
        const worldX = this.x + m.offx;
        const worldY = this.y + m.offy;
        const x = Math.round(worldX - (m.w / 2));
        const y = Math.round(worldY - (m.h / 2));
        return new Phaser.Geom.Rectangle(x, y, m.w, m.h);
    }

    update(time, delta) {
        this.stateMachine.step();

        if (this.held) {
            const active = this.scene.input.activePointer;
            this.drag(active);
        }
        this.bodyFollow();

        // refresh magnets
        for (const side of SIDES) {
            const m = this.magnets[side];
            const zone = this.magnetZones[side];
            const vis = this.magnetVisuals[side];
            if (!zone) continue;
            const magx = Math.round(this.x + m.offx);
            const magy = Math.round(this.y + m.offy);
            zone.setPosition(magx, magy);
            if (zone.body) {
                zone.body.x = magx - (zone.width / 2);
                zone.body.y = magy - (zone.height / 2);
                if (zone.body.updateFromGameObject) zone.body.updateFromGameObject();
            }
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

        // unsnap sound
        this.scene.sound.play('unsnap', { volume: 0.4 });

        const partner = this.snapPartner;

        // reset snap vars
        this.snapped = false;
        this.snapPartner = null;
        this.snapping = null;
        this.mover = false;

        if (partner && partner.snapPartner === this) {
            partner.snapped = false;
            partner.snapPartner = null;
            partner.snapping = null;
            partner.mover = false;
        }
    }

    pickUp(pointer) {
        if (this.held) return;
        if (this.snapped) this.unsnap();

        this.held = true;
        this.landed = false;

        // start dragging
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

        // pointer target
        const targetX = pointer.worldX + this.dragOffset.x;
        const targetY = pointer.worldY + this.dragOffset.y;
        const centerX = this.body.position.x + (this.body.width * 0.5) + (this.body.offset.x);
        const centerY = this.body.position.y + (this.body.height * 0.5) + (this.body.offset.y);

        // pointer follow
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

        // pointer follow speed
        let velocityX = Phaser.Math.Clamp((targetX - centerX) * this.dragSpeed, -this.dragMaxSpeed, this.dragMaxSpeed);
        let velocityY = Phaser.Math.Clamp((targetY - centerY) * this.dragSpeed, -this.dragMaxSpeed, this.dragMaxSpeed);

        if ((this.body.blocked.left && velocityX < 0) || (this.body.blocked.right && velocityX > 0)) velocityX = 0;
        if ((this.body.blocked.up && velocityY < 0) || (this.body.blocked.down && velocityY > 0)) velocityY = 0;

        this.body.setVelocity(velocityX, velocityY);
    }

    drop() {
        if (!this.held) return;

        // reset physics
        this.held = false;
        this.snapping = null;
        this.body.setAllowGravity(true);
        this.body.setVelocity(0, 0);
        this.body.setDrag(0);
    }

    flip() {
        if (!this.held) return;
        if (this.animCycle) return;
        if (this.stateMachine.state !== 'idle') return;
        this.stateMachine.transition('flip');
    }

    bodyFollow() {
        const centerX = this.body.position.x + (this.body.width * 0.5) + this.body.offset.x;
        const centerY = this.body.position.y + (this.body.height * 0.5) + this.body.offset.y;
        this.x = centerX;
        this.y = centerY;
    }
}

// state machine classes
class BlockIdleState extends State {
    enter(scene, block) {
        block.screen.play('Idle1', true);

        // timer for idle anims
        block.idleTimer = clearTimer(block.idleTimer);
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
        if (block.animCycle) return;

        // snapping resets
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

        // side collision
        const pair = `${block.touchSide}:${other.touchSide}`;
        let axis = null;
        if (HORIZONTALS.has(pair)) axis = 'h';
        if (VERTICALS.has(pair)) axis = 'v';
        if (!axis) return;

        // mover/nover (non mover) selection
        let mover, nover;
        if (block.y < other.y) {
            mover = block;
            nover = other;
        } else {
            mover = other;
            nover = block;
        }

        // mover/nover vars
        if (!mover || !nover) return;
        const moverSide = mover.touchSide;
        const noverSide  = nover.touchSide;
        const moverMag = mover.magnetCoords(moverSide);
        const noverMag  = nover.magnetCoords(noverSide);
        const moverOffset = mover.snapOffset[moverSide] || {x:0,y:0};
        const dx = (noverMag.x + moverOffset.x) - moverMag.x;
        const dy = (noverMag.y + moverOffset.y) - moverMag.y;

        // mover/nover snap transition
        mover.snapAlign = { dx, dy };
        mover.snapPartner = nover;
        nover.snapPartner = mover;

        mover.mover = true;
        nover.mover = false;
        mover.snapping = null;
        nover.snapping = null;

        mover.stateMachine.transition('snap');
        nover.stateMachine.transition('snap');
    }

    exit(scene, block) {
        block.idleTimer = clearTimer(block.idleTimer);
    }
}

class BlockFlipState extends State {
    enter(scene, block) {
        // flip block
        scene.sound.play('flip', { volume: 0.4 });
        block.angle -= 90;
        block.screen.angle += 90;
        block.sideDown = (block.sideDown + 1) % 4;
        block.screen.play('Flip');
        block.screen.once('animationcomplete', () => this.stateMachine.transition('idle'));
    }
    execute() {}
    exit() {}
}

class BlockSnapState extends State {
    playAnims(sprite, key, loop = false) {
        if (!sprite || !sprite.anims) return;
        const anim = sprite.anims.current;
        if (!anim || anim.key !== key) {
            sprite.play(key);
            if (loop && sprite.anims.current) sprite.anims.current.repeat = -1;
        }
    }

    enter(scene, block) {
        // return if not snapped
        const other = block.snapPartner;
        if (!other || !other.body) {
            block.stateMachine.transition('idle');
            return;
        }

        // snap positioning
        if (block.mover && block.snapAlign) {
            const dx = block.snapAlign.dx;
            const dy = block.snapAlign.dy;
            const targetX = Math.round(block.body.position.x + dx);
            const targetY = Math.round(block.body.position.y + dy);
            block.body.reset(targetX, targetY);
            block.snapAlign = null;
        }
        block.snapped = true;
        if (block.mover) scene.sound.play('snap', { volume: 0.2 });

        // side categorization
        const pair = `${block.touchSide}:${other.touchSide}`;
        if (pair === 'left:right' || pair === 'right:left') {
            block.visit.axis = 'horizontal';
            other.visit.axis = 'horizontal';
        } else if (pair === 'up:down' || pair === 'down:up') {
            block.visit.axis = 'vertical';
            other.visit.axis = 'vertical';
        } else {
            block.visit.axis = null;
            other.visit.axis = null;
        }

        // deciding visit
        if (block.visit.axis === 'horizontal') {
            if (block.x > other.x) { block.visit.role = 'visit'; other.visit.role = 'host'; }
            else { block.visit.role = 'host'; other.visit.role = 'visit'; }
        } else if (block.visit.axis === 'vertical') {
            if (block.y < other.y) { block.visit.role = 'visit'; other.visit.role = 'host'; }
            else { block.visit.role = 'host'; other.visit.role = 'visit'; }
        } else {
            if (block.touchSide === 'right' || block.touchSide === 'up') { block.visit.role = 'visit'; other.visit.role = 'host'; }
            else { block.visit.role = 'host'; other.visit.role = 'visit'; }
        }

        // start 3s timer before visiting
        if (block.visit.role === 'visit') {
            block.visit.timer = clearTimer(block.visit.timer);
            block.visit.phase = 0;

            block.visit.timer = scene.time.delayedCall(3000, () => {
                if (!block.snapped || block.visit.role !== 'visit') return;
                const host = block.snapPartner;
                if (!host) return;

                block.visit.active = true;
                block.visit.partner = host;
                host.visit.active = true;
                host.visit.partner = block;

                block.animCycle = true;
                host.animCycle = true;

                block.stateMachine.transition('visit');
                host.stateMachine.transition('host');
            });
        }

        if (block.visit.role === 'host' && block.stateMachine.state === 'snap') {
            this.playAnims(block.screen, 'Idle1', true);
        }
    }

    execute(scene, block) {
        if (!block.snapped && !block.visit.active) {
            block.stateMachine.transition('idle');
            return;
        }
    }

    exit(scene, block) {
        block.visit.timer = clearTimer(block.visit.timer);
        block.visit.phase = 0;
    }
}

class BlockVisitState extends State {
    enter(scene, block) {
        if (!block.visit.active || !block.visit.partner) {
            block.visit.active = false;
            block.animCycle = false;
            return block.stateMachine.transition('idle');
        }

        block.visit.phase = 1;
        this.nextAnim(scene, block);
    }

    execute() {}

    exit(scene, block) {
        // clear timers/vars
        block.phase1 = false;
        if (block.visit.partner) block.visit.partner.phase1 = false;
        block.visit.checkTimer = clearTimer(block.visit.checkTimer);
        block.animCycle = false;
        if (block.visit.active) {
            block.visit.active = false;
            const p = block.visit.partner;
            if (p) { p.visit.active = false; p.visit.partner = null; }
            block.visit.partner = null;
        }
        block.visit.phase = 0;
        block.visit.returning = false;
    }

    // animation manager
    callAnims(sprite, key, loop = false) {
        if (!sprite || !sprite.anims) return;
        const anim = sprite.anims.current;
        if (anim && anim.key === key) return;
        sprite.play(key);
        if (loop && sprite.anims.current) sprite.anims.current.repeat = -1;
    }

    // finish one anim at a time
    singleAnim(sprite, key, handler) {
        if (!sprite || !sprite.on) return;
        const anim = (anim) => {
            if (!anim || anim.key !== key) return;
            sprite.off('animationcomplete', anim);
            handler();
        };
        sprite.on('animationcomplete', anim);
    }

    nextAnim(scene, block) {
        const host = block.visit.partner;
        if (!host) return this.return(scene, block);

        switch (block.visit.phase) {
            case 1: // wave anim
                if (block.visit.axis === 'horizontal') {
                    let visitorDone = false;
                    let hostDone = false;
                    const checkDone = () => {
                        if (!visitorDone || !hostDone) return;
                        this.callAnims(block.screen, 'Idle1');
                        this.callAnims(host.screen, 'Idle1');
                        scene.time.delayedCall(200, () => {
                            if (!block.visit.active) return;
                            block.visit.phase = 2;
                            this.nextAnim(scene, block);
                        });
                    };

                    if (!block.phase1) {
                        block.phase1 = true;
                        this.singleAnim(block.screen, 'WaveR', () => {
                            block.phase1 = false;
                            visitorDone = true;
                            checkDone();
                        });
                    }

                    if (!host.phase1) {
                        host.phase1 = true;
                        this.singleAnim(host.screen, 'WaveL', () => {
                            host.phase1 = false;
                            hostDone = true;
                            checkDone();
                        });
                    }

                    // start waves
                    block.screen.play('WaveR');
                    host.screen.play('WaveL');
                } else {
                    block.visit.phase = 2;
                    this.nextAnim(scene, block);
                }
                break;

            case 2: // visit leaves anims
                if (block.visit.axis === 'horizontal') this.callAnims(block.screen, 'LeaveR');
                else this.callAnims(block.screen, 'LeaveU');

                block.screen.once('animationcomplete', () => {
                    if (!block.visit.active) return;
                    block.visit.phase = 3;
                    this.nextAnim(scene, block);
                });
                break;

            case 3: // visit closes anims
                this.callAnims(block.screen, 'Close');
                block.screen.once('animationcomplete', () => {
                    if (!block.visit.active) return;
                    this.callAnims(block.screen, 'Closed', true);
                    block.visit.phase = 4;
                    this.nextAnim(scene, block);
                });
                break;

            case 4: // host arrives anims
                if (block.visit.axis === 'horizontal') this.callAnims(host.screen, 'ArriveL');
                else this.callAnims(host.screen, 'ArriveD');

                host.screen.once('animationcomplete', () => {
                    if (!block.visit.active) return;
                    block.visit.phase = 5;
                    this.nextAnim(scene, block);
                });
                break;

            case 5: // idle together anims
                if (block.visit.returning) return;
                this.callAnims(host.screen, 'IdleT', true);
                this.callAnims(block.screen, 'Closed', true);

                block.visit.checkTimer = clearTimer(block.visit.checkTimer);

                // unsnapped check
                block.visit.checkTimer = scene.time.addEvent({
                    delay: 200,
                    loop: true,
                    callback: () => {
                        if (!block.visit.active) {
                            block.visit.checkTimer = clearTimer(block.visit.checkTimer);
                            return;
                        }

                        const partner = block.visit.partner;
                        const stillSnappedSameSide = partner &&
                            partner.snapped &&
                            block.snapped &&
                            partner.touchSide && block.touchSide &&
                            (
                                (block.touchSide === 'left'  && partner.touchSide === 'right') ||
                                (block.touchSide === 'right' && partner.touchSide === 'left')  ||
                                (block.touchSide === 'up'    && partner.touchSide === 'down')  ||
                                (block.touchSide === 'down'  && partner.touchSide === 'up')
                            );

                        if (stillSnappedSameSide) {
                            return; 
                        } else {
                            block.visit.checkTimer = clearTimer(block.visit.checkTimer);
                            block.visit.returning = true;
                            this.returning(scene, block);
                        }
                    }
                });

                // 20s fallback return
                scene.time.delayedCall(20000, () => {
                    if (!block.visit.active) return;
                    block.visit.returning = true;
                    block.visit.checkTimer = clearTimer(block.visit.checkTimer);
                    this.returning(scene, block);
                });
                break;

            default:
                this.return(scene, block);
                break;
        }
    }

    // return anims
    returning(scene, block) {
        const host = block.visit.partner;
        if (!host) return this.return(scene, block);

        // host leaves anims
        if (block.visit.axis === 'horizontal') host.screen.play('LeaveL');
        else host.screen.play('LeaveD');

        host.screen.once('animationcomplete', () => {
            if (host.stateMachine && host.stateMachine.state !== 'idle') host.stateMachine.transition('idle');

            // visit returns anims
            block.screen.play('Open');
            block.screen.once('animationcomplete', () => {
                if (block.visit.axis === 'horizontal') block.screen.play('ArriveR');
                else block.screen.play('ArriveU');

                block.screen.once('animationcomplete', () => {
                    this.return(scene, block);
                });
            });
        });
    }

    // finish return and reset vars
    return(scene, block) {
        const host = block.visit.partner;
        block.visit.checkTimer = clearTimer(block.visit.checkTimer);
        block.visit.active = false;
        block.animCycle = false;
        block.visit.phase = 0;
        block.visit.returning = false;

        if (host) {
            host.visit.active = false;
            host.visit.partner = null;
            host.visit.phase = 0;
            host.animCycle = false;
            if (host.stateMachine && host.stateMachine.state !== 'idle') host.stateMachine.transition('idle');
        }

        block.visit.partner = null;

        if (block.stateMachine && block.stateMachine.state !== 'idle') block.stateMachine.transition('idle');
    }
}


class BlockHostState extends State {
    enter(scene, block) {}
    execute() {}
    exit() {}
}