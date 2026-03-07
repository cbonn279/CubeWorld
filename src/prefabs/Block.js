class Block extends Phaser.GameObjects.Container {

    constructor(scene, x, y, frameKey, screenKey) {
        super(scene, x, y)
        scene.add.existing(this)

        // visuals
        this.frame = scene.add.image(0, 0, frameKey).setOrigin(0.5)
        this.screen = scene.add.sprite(0, 1 , screenKey).setOrigin(0.5)

        this.add([this.frame, this.screen])

        this.setScale(3)

        // physics
        scene.physics.world.enable(this)

        this.body.setCollideWorldBounds(true)
        this.body.setBounce(0.1)

        this.body.setSize(this.frame.displayWidth * 0.9, this.frame.displayHeight * 0.9)
        this.body.setOffset(-this.frame.displayWidth * 0.45, -this.frame.displayHeight * 0.45)

        this.frame.setInteractive()

        // drag control
        this.held = false
        this.dragOffset = {x:0, y:0}

        // direction tracking
        this.sideDown = 0

        // state machine
        this.stateMachine = new StateMachine('idle',{
            idle: new BlockIdleState(),
            flip: new BlockFlipState()
        },[scene,this])

        // pointer stuff
        this.frame.on('pointerdown', (pointer)=>{
            this.pickUp(pointer)
        })

        scene.input.on('pointerup', ()=>{
            if(this.held) this.drop()
        })

        scene.input.on('pointermove', (pointer)=>{
            if(this.held) this.drag(pointer)
        })
    }

    update(){
        this.stateMachine.step()
    }

    pickUp(pointer){
        this.held = true
        this.body.enable = false
        this.dragOffset.x = this.x - pointer.worldX
        this.dragOffset.y = this.y - pointer.worldY
    }

    drop(){
        this.held = false
        this.body.enable = true
    }

    drag(pointer){
        this.x = pointer.worldX + this.dragOffset.x
        this.y = pointer.worldY + this.dragOffset.y
    }

    flip(){
        if(!this.held) return
        this.stateMachine.transition('flip')
    }

}

class BlockIdleState extends State {

    enter(scene, block){

        // idle stance
        block.screen.play('Idle1', true)

        // timer for idle animations
        block.idleTimer = scene.time.addEvent({
            delay: 10000,
            loop: true,
            callback: () => {
                if(block.stateMachine.state === 'idle'){
                    block.screen.play('Idle2')
                    block.screen.once('animationcomplete', () => {
                        block.screen.play('Idle1', true)
                    })
                }
            }
        })
    }

    execute(scene, block){}

    exit(scene, block){

        // turn off timer
        if(block.idleTimer){
            block.idleTimer.remove()
            block.idleTimer = null
        }

    }

}

class BlockFlipState extends State {

    enter(scene, block){

        // rotate frame w/out screen
        block.angle -= 90
        block.screen.angle += 90

        // bottom side noted
        block.sideDown = (block.sideDown + 1) % 4

        block.screen.play('Flip')

        // idle transition
        block.screen.once('animationcomplete', () => {
            this.stateMachine.transition('idle')
        })
    }
}