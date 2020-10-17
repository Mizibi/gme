import * as THREE from "three";
import { AnimationMixer, Object3D } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const cameraFOV = 75
const cameraAspect = window.innerWidth / window.innerHeight
const cameraClose = 0.001
const cameraFar = 1000

const rendererParams = {
    antialias: true,
}

var clock = new THREE.Clock();

class Program {
    private readonly scene = new THREE.Scene();
    private readonly camera = new THREE.PerspectiveCamera(cameraFOV, cameraAspect, cameraClose, cameraFar);
    private readonly renderer = new THREE.WebGLRenderer(rendererParams);
    private readonly controls = new OrbitControls(this.camera, this.renderer.domElement);
    mixer: any

    constructor() {
        // Apply threejs to HTML Canvas
        document.body.appendChild(this.renderer.domElement)

        this.renderer.shadowMap.enabled = true;

        // this.generateCube()
        this.generateFloor()
        this.genereateLightning()

        this.loadModel()

        // Init orbit controls
        this.controls.update()

        // Set default camera position
        this.camera.position.set(0, 2, -2);

        // Set background white
        // this.scene.background = new THREE.Color(0xffffff);
        this.scene.background = new THREE.Color().setHSL( 0.6, 0, 1 );
        this.scene.fog = new THREE.Fog( this.scene.background, 1, 5000 );

        // Render scene animation
        this.render()

    }

    private genereateLightning() {
        let dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        dirLight.color.setHSL( 0.1, 1, 0.95 );
        dirLight.position.set( -1, 2, -3 );
        dirLight.castShadow = true;
        
        var d = 5;
        
        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;
        
        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = - 0.0001;
        
        this.scene.add( dirLight );
        let dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
        this.scene.add( dirLightHelper );
    }
    private generateCube() {
        let geometry = new THREE.BoxGeometry();
        let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        let cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
    }

    private generateFloor() {
        // Floor
        // let floorGeometry = new THREE.PlaneGeometry(20, 20, 10);
        // var material = new THREE.MeshBasicMaterial( {color: 0x2194ce} );
        // let floor = new THREE.Mesh(floorGeometry, material);
        // floor.rotation.x -= Math.PI/2;

        // floor.receiveShadow = true;
        // floor.position.y = -1;
        // this.scene.add(floor);

        var groundGeo = new THREE.PlaneBufferGeometry( 100, 100 );
        var groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
        groundMat.color.setHSL( 0.095, 1, 0.75 );
        var ground = new THREE.Mesh( groundGeo, groundMat );
        ground.position.y = - 5;
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add( ground );
    }

    private loadModel() {
        var loader = new GLTFLoader();

        let saucer: Object3D
        loader.load(
            require('../assets/phoenix.glb'),
            gltf => {
                console.log(gltf)
                
                saucer = gltf.scene.children[0]
                saucer.scale.setScalar(0.001)
                saucer.position.set(0, 0, 0)
                saucer.castShadow = true;
                saucer.receiveShadow = true;
                this.mixer = new THREE.AnimationMixer(saucer);
                var clips = gltf.animations;
                var clip = THREE.AnimationClip.findByName(clips, "Take 001");
                var action = this.mixer.clipAction(clip);
                action.play();

                this.scene.add(saucer)

                console.log('Loaded flying saucer')
            },
            undefined,
            err => console.error('Failed to load charmander model', err)
        );
    }
    private adjustCanvasSize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
    }

    private render() {
        this.adjustCanvasSize();
        requestAnimationFrame(() => this.render());

        this.controls.update();

        if (this.mixer) this.mixer.update(0.01);

        this.renderer.render(this.scene, this.camera);
    }
}

export default Program