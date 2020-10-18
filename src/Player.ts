import * as THREE from "three";
import { Loader } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

enum playerType {
    PHOENIX = 0,
}
const selectablePlayer = new Map()
selectablePlayer.set(0, '../assets/phoenix.glb')

var keyboard = {};
function keyDown(event){
	keyboard[event.keyCode] = true;
}

function keyUp(event){
	keyboard[event.keyCode] = false;
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
class Player {
    public object: THREE.Object3D
    public mixer: THREE.AnimationMixer

    constructor(scene, camera, public playerType: number) {
        this.loadObject(scene, camera)
    }

    private loadObject(scene, camera) {
        new GLTFLoader().load(
            require('../assets/phoenix.glb'),
            model => {
                console.log(model)
                this.object = model.scene.children[0]
                this.object.traverse(n => {
                    if (n.isObject3D) {
                        n.castShadow = true
                        n.receiveShadow = true
                    }
                })
                this.initModel()
                this.initAnimation(model.animations)
                scene.add(this.object)


            },
            progress => {
                console.log('Loading...' + progress.loaded)
            },
            err => {
                console.log('Error happened :')
                console.log(err)
            }
        )
    }

    private initModel() {
        this.object.scale.setScalar(0.003)
        this.object.position.set(0, 0, 0)
        this.object.castShadow = true
        this.object.receiveShadow = true
    }

    private initAnimation(animations) {
        console.log(animations)
        this.mixer = new THREE.AnimationMixer(this.object);
        var clip = THREE.AnimationClip.findByName(animations, "Take 001");
        var action = this.mixer.clipAction(clip);
        action.play();
    }

    movements(camera) {
        const speed = 0.1
        if (keyboard[38]) {
            this.object.translateX(speed)
        }
        if (keyboard[40]) {
            this.object.translateX(-speed)
        }
        if (keyboard[39]) {
            this.object.rotation.z -= speed
        }
        if (keyboard[37]) {
            this.object.rotation.z += speed
            // camera.rotation.z += speed
        }
        // camera.lookAt(this.object.position)
    }
}

export default Player