import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

import Player from './Player'

const cameraFOV = 75
const cameraAspect = window.innerWidth / window.innerHeight
const cameraClose = 0.001
const cameraFar = 1000

const rendererParams = {
    antialias: true,
}


class Program {
    private player: Player
    private readonly scene = new THREE.Scene();
    private readonly camera = new THREE.PerspectiveCamera(cameraFOV, cameraAspect, cameraClose, cameraFar);
    private readonly renderer = new THREE.WebGLRenderer(rendererParams);
    private readonly controls = new OrbitControls(this.camera, this.renderer.domElement);
    private readonly clock = new THREE.Clock();
    private readonly stats = Stats()
    private mainLight
    constructor() {
        // Apply threejs to HTML Canvas
        document.body.appendChild(this.renderer.domElement)

        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ReinhardToneMapping
        this.renderer.toneMappingExposure = 2.3
        // Player :
        this.player = new Player(this.scene, this.camera, 0)
        
        // this.generateCube()
        this.generateFloor()
        this.genereateLightning()


        // Init orbit controls
        this.controls.target.set(0, 1, 0);
        this.controls.update()
        this.controls.enableKeys = false
        this.generateGUI()
        this.generateStats()

        // Set default camera position
        this.camera.position.set(-5, 2, 0);
        this.camera.lookAt(0, 0, 0)
        // Set background and fog white
        // this.scene.fog = new THREE.Fog(0x000000, 1, 5000);

        // Add axes helper
        this.scene.add(new THREE.AxesHelper(500))

        // Render scene animation
        this.render()

    }

    private generateGUI() {
        let panel = new GUI({ width: 310 })

        let folder = panel.addFolder('Base Actions');
        let panelSettings = {
            'modify lightning': 1.0
        };
        folder.add(panelSettings, 'modify lightning', 0.0, 2, 0.01).onChange(this.editLight.bind(this));
        folder.open()

    }
    editLight(intensity) {
        this.mainLight.intensity = intensity
    }

    private generateStats() {
        document.body.appendChild( this.stats.dom );
    }
    private genereateLightning() {
        let hemiLight = new THREE.AmbientLight(0xffffff, 0.2)
        this.scene.add(hemiLight)

        this.mainLight = new THREE.PointLight(0xffffff, 0.2)
        this.mainLight.position.set(-3, 6, -3)
        this.mainLight.castShadow = true
        this.mainLight.shadow.camera.near = 0.1
        this.mainLight.shadow.camera.far = 25
        this.scene.add(this.mainLight)

        // this.mainLight.color.setHSL(0.1, 1, 0.95);
        // this.mainLight.position.set(-1, 2, -3);
        // this.mainLight.castShadow = true;

        // this.scene.add(this.mainLight);

        // let dirLightHelper = new THREE.DirectionalLightHelper(this.mainLight, 10);
        // this.scene.add(dirLightHelper);
    }

    private generateFloor() {
        const groundSize = 10
        var groundGeo = new THREE.PlaneBufferGeometry(groundSize, groundSize);
        var groundMat = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            shininess: 30,
        });
        // groundMat.color.setHSL(0.095, 1, 0.75);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = - 1;
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    private adjustCanvasSize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
    }

    private render() {
        this.adjustCanvasSize();
        requestAnimationFrame(() => this.render());

        // this.controls.update();
        this.stats.update();

        
        // Player animation
        if (this.player.mixer) this.player.mixer.update(0.01);
        // Player movements
        this.player.movements(this.camera)

        this.renderer.render(this.scene, this.camera);
    }
}

export default Program