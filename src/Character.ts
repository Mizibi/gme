
import * as THREE from "three";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Body, Vec3, Sphere } from 'cannon'
import { IWorldEntity } from './interfaces/IWorldEntity';
import { EntityType } from './enums/EntityType';
import { KeyBinding } from './lib/KeyBinding';

var keyboard = {}
function keyDown(event) {
    event.preventDefault()
    keyboard[event.keyCode] = true
}

function keyUp(event) {
    event.preventDefault()
    keyboard[event.keyCode] = false
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

export class Character extends THREE.Object3D {
    public updateOrder: number = 1
    public entityType: EntityType = EntityType.Character
    public height: number = 1;
    public modelContainer: any /*THREE.Group*/;
    public modelDebugCapsule: any /*THREE.Group*/;
    public characterCapsule: Body;
    public mixer: THREE.AnimationMixer
    public animations: THREE.AnimationAction[] = []

    // Movement
	public acceleration: THREE.Vector3 = new THREE.Vector3();
	public velocity: THREE.Vector3 = new THREE.Vector3();
	public arcadeVelocityInfluence: THREE.Vector3 = new THREE.Vector3();
	public velocityTarget: THREE.Vector3 = new THREE.Vector3();
    
    public actions: { [action: string]: KeyBinding };

    public speed: number = 0
    public computedSpeed: number = 0
    public maxSpeed: number = 16

    constructor(public world) {
        super()
    }

    public async initAsync() {
        // const model1 = await new FBXLoader().loadAsync(require('../assets/Idle.fbx'))
        this.modelContainer = await new GLTFLoader().loadAsync(require('../assets/Xbot.glb'))

        // console.log(model1)
        console.log(this.modelContainer)

        this.initModel()
        this.initAnimations()
        this.initPhysics()

        const skeleton = new THREE.SkeletonHelper( this.modelContainer.scene );
        skeleton.visible = true;
        this.world.scene.add(skeleton)
        
        this.world.scene.add(this.modelContainer.scene)
    }

    private initModel() {
        this.modelContainer.scene.scale.setScalar(1)
        this.modelContainer.scene.position.set(0, 5, 0)
        this.modelContainer.scene.castShadow = true
        this.modelContainer.scene.receiveShadow = true
    }

    private initAnimations() {
        this.mixer = new THREE.AnimationMixer(this.modelContainer.scene);
        const animationsLength = this.modelContainer.animations.length;
        // const clip = THREE.AnimationClip.findByName(this.modelContainer.animations, "idle");

        const actions = ['idle', 'walk', 'run']
        for (let i = 0; i < animationsLength; i++) {
            let clip = this.modelContainer.animations[i];
            console.log(clip)
            if (actions.includes(clip.name)) {
                const mixedAnimation = this.mixer.clipAction(clip)
                this.animations.push(mixedAnimation)

                mixedAnimation.play();
            }
        }
        console.log(this.animations)
        this.animations[1].weight = 0
        this.animations[2].weight = 0
    }

    private initPhysics() {
        const sphereShape = new Sphere(0.25)
        // Physics body from Box3 center and size
        this.characterCapsule = new Body({
            mass: 10,
            shape: sphereShape,
            position: new Vec3(this.modelContainer.scene.position.x, this.modelContainer.scene.position.y, this.modelContainer.scene.position.z),
            linearDamping: 0.9,
            angularDamping: 0.8,
        });

        this.modelDebugCapsule = new THREE.Mesh( 
            new THREE.SphereGeometry(0.25, 16, 16), 
            new THREE.MeshBasicMaterial({color: 0xffff00, wireframe: true})
            )
        
        this.world.scene.add( this.modelDebugCapsule );

        // var contactNormal = new Vec3();
        // var upAxis = new Vec3(0,1,0);
        // const that = this
        // this.characterCapsule.addEventListener("collide", (e) => {
        //     var contact = e.contact;
    
        //     if(contact.bi.id == that.characterCapsule.id)  // bi is the player body, flip the contact normal
        //         contact.ni.negate(contactNormal);
        //     else
        //         contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is
    
        //     // if(contactNormal.dot(upAxis) > 0.5) // Use a "good" threshold value between 0 and 1 here!
        //     //     canJump = true;
        // });

        // this.characterCapsule.allowSleep = false;
        
        // this.characterCapsule.fixedRotation = true;
		// this.characterCapsule.updateMassProperties();

        this.world.physicsWorld.addBody(this.characterCapsule);
    }

    movements() {
        // Update with input

        const { delta } = this.world

        if (keyboard[38]) {
            this.characterCapsule.velocity.z += this.speed * delta
        }
        if (keyboard[40]) {
            this.characterCapsule.velocity.z -= this.speed * delta
        }
        if (keyboard[39]) {
            this.characterCapsule.velocity.x -= this.speed * delta
        }
        if (keyboard[37]) {
            this.characterCapsule.velocity.x += this.speed * delta
        }
        if (keyboard[32]) {
                this.characterCapsule.velocity.y += this.speed * delta
        }

        if (!keyboard[38] && !keyboard[40] && !keyboard[39] && !keyboard[37]) {
            if (this.speed > 0) this.speed--
        } else {
            if (this.speed <= this.maxSpeed) this.speed++
        }
        // Update physics
        this.modelContainer.scene.position.copy(this.meshOnBody());
        // this.modelContainer.quaternion.copy(this.characterCapsule.quaternion);

        this.modelDebugCapsule.position.copy(this.characterCapsule.position);
        this.modelDebugCapsule.quaternion.copy(this.characterCapsule.quaternion);
        
        this.computedSpeed = this.characterCapsule.velocity.z
        if (this.speed == 0) {
            this.animations[0].weight = 1
            this.animations[1].weight = 0
            this.animations[2].weight = 0
        } 
        else {
            this.animations[0].weight = 0
            this.animations[2].weight = 1
        }
    }
    meshOnBody() {
        const radius = this.characterCapsule.shapes[0].radius
        const position = this.characterCapsule.position
        return new THREE.Vector3(position.x, position.y - radius, position.z)
    }
}

export default Character