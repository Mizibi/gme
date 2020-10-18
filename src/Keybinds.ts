export default class Keybinds {
    moveForward = false
    moveBackwards = false
    moveLeft = false
    moveRight = false
    
    constructor() {
        window.addEventListener( 'keydown', this.onKeyDown.bind(this), false );
        window.addEventListener( 'keyup', this.onKeyUp.bind(this), false );    
    }

    onKeyDown(e) {
        console.log('Keydown')
        //event.preventDefault();
        const { keyCode } = e

        switch (keyCode) {
            case 38: /*up*/ this.moveForward = true
            case 37: /*left*/ this.moveLeft = true
            case 40: /*down*/ this.moveBackwards = true
            case 39: /*right*/ this.moveRight = true
        }
    };
    onKeyUp(e) {
        //event.preventDefault();
        const { keyCode } = e

        switch (keyCode) {
            case 38: /*up*/ this.moveForward = false; this.moveRight = false; this.moveLeft = false
            case 37: /*left*/ this.moveLeft = false
            case 40: /*down*/ this.moveBackwards = false; this.moveRight = false; this.moveLeft = false
            case 39: /*right*/ this.moveRight = false
        }
    }
}