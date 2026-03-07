class Play extends Phaser.Scene {

    constructor(){
        super({ key:'Play' })
    }

    create(){

        // wall
        this.add.image(512,300,'wall').setScale(1.8)

        // table
        const table = this.physics.add.staticImage(512,520,'table').setScale(2)

        // blocks
        this.blocks = []

        const b1 = new Block(this,360,300,'F1','stick')
        const b2 = new Block(this,660,300,'F2','stick')

        this.blocks.push(b1,b2)

        this.blocks.forEach(b=>{
            this.physics.add.collider(b,table)
        })

        // flip controls
        this.input.keyboard.on('keydown-SPACE', ()=>{
            const held = this.blocks.find(b=>b.held)
            if(held) held.flip()
        })

    }

    update(){
        this.blocks.forEach(b=>b.update())
    }

}