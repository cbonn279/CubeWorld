// Christian Bonardi
// Cube World
// Last Updated: 3/4/2026
// Time Taken: 28 hours

/*Sources:
https://github.com/nathanaltice/BigBodies
https://docs.phaser.io/api-documentation/class/physics-matter-pointerconstraint
https://phaser.io/examples/v3.85.0/game-objects/container/view/draggable-container
https://www.youtube.com/watch?v=sF9mElVi5lQ&list=PLmcXe0-sfoSh1o3fm-_2JOod-wRUxnqb_&t=1197s
https://phaser.discourse.group/t/dragging-containers-and-nested-containers/1258
https://stackoverflow.com/questions/66753822/how-to-transition-to-falling-state-with-state-machine-phaser
https://www.reddit.com/r/gamemaker/comments/8cn84w/gms2_transitional_animations_in_a_state_machine/
*/

const config = {
    parent: 'phaser-game',
    type: Phaser.WEBGL,
    width: 1024,
    height: 600,
    backgroundColor: '#889089',   
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 2000 },
            debug: false
        }
    },
    scene: [ Load, Start, Play, Message ]
}

const game = new Phaser.Game(config)