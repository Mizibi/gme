import * as THREE from "three";
// import { CannonDebugRenderer } from './lib/cannon/debug'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
import { Body, Box, Vec3, Plane, NaiveBroadphase, Material, ContactMaterial, Heightfield } from 'cannon'
import * as cannon from 'cannon'

import { IUpdatable } from './interfaces/IUpdatable';
import { IWorldEntity } from './interfaces/IWorldEntity';

import Character from './Character'

const cameraFOV = 75
const cameraAspect = window.innerWidth / window.innerHeight
const cameraClose = 0.001
const cameraFar = 1000

const rendererParams = {
    antialias: true,
}

let counter = 0
const cubes = []
class World {
    public renderer = new THREE.WebGLRenderer(rendererParams);
    private readonly camera = new THREE.PerspectiveCamera(cameraFOV, cameraAspect, cameraClose, cameraFar);
    // public composer: any;
    public physicsWorld: cannon.World
    public physicsFrameRate: number;
    public physicsFrameTime: number;
    public player: Character
    public clock = new THREE.Clock();
    private readonly scene = new THREE.Scene();
    private readonly controls = new OrbitControls(this.camera, this.renderer.domElement);
    private readonly stats = Stats()
    public delta = 0
    private mainLight

    public updatables: IUpdatable[] = [];

    cubeMesh
    cubeBody
    cubeHelper: THREE.Box3Helper
    boxHelper
    groundPhysicsMaterial
    constructor() {
        // Apply threejs to HTML Canvas
        document.body.appendChild(this.renderer.domElement)

        // Physics engine
        this.initWorld()

        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ReinhardToneMapping
        this.renderer.toneMappingExposure = 2.3

        this.generateFloor()
        this.genereateLightning()

        this.player = new Character(this)

        // Init orbit controls
        this.controls.target.set(0, 1, 0);
        this.controls.update()
        this.controls.enableKeys = false
        this.generateStats()

        this.initParticle()

        // Set default camera position
        this.camera.position.set(-5, 2, 0);
        // this.camera.lookAt(0, 0, 0)
        this.camera.lookAt(this.scene.position);

        // Set background and fog white
        // this.scene.fog = new THREE.Fog(0x000000, 1, 5000);

        // Add axes helper
        this.scene.add(new THREE.AxesHelper(500))

        setInterval(() => {
            const phongMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial()
            const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
            this.cubeMesh = new THREE.Mesh(cubeGeometry, phongMaterial)
            this.cubeMesh.position.z = 2
            this.cubeMesh.position.y = 5
            this.cubeMesh.castShadow = true
            this.scene.add(this.cubeMesh)
            const cubeShape = new Box(new Vec3(.5, .5, .5))
            this.cubeBody = new Body({ mass: 0.5 });
            this.cubeBody.addShape(cubeShape)
            this.cubeBody.position.x = this.cubeMesh.position.x + Math.floor(Math.random() * Math.floor(2));
            this.cubeBody.position.y = this.cubeMesh.position.y + Math.floor(Math.random() * Math.floor(2))
            this.cubeBody.position.z = this.cubeMesh.position.z + Math.floor(Math.random() * Math.floor(2))
            this.physicsWorld.addBody(this.cubeBody)
            cubes.push({ mesh: this.cubeMesh, body: this.cubeBody, id: counter })
            counter++
        }, 1000)

        // this.camera.position.set(0, 500, 0)

    }

    async initAsync() {
        await this.player.initAsync()
        this.generateGUI()
    }
    public add(worldEntity: IWorldEntity): void {
        worldEntity.addToWorld(this);
        this.registerUpdatable(worldEntity);
    }

    public registerUpdatable(registree: IUpdatable): void {
        this.updatables.push(registree);
        this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder) ? 1 : -1);
    }

    private initWorld() {
        this.physicsWorld = new cannon.World()
        this.physicsWorld.gravity.set(0, -9.81, 0)
        this.physicsWorld.broadphase = new NaiveBroadphase()
        // this.physicsWorld.broadphase.useBoundingBoxes = true
        this.physicsWorld.solver.iterations = 10

        this.physicsFrameRate = 60;
        this.physicsFrameTime = 1 / this.physicsFrameRate;
    }

    private initParticle() {
        // create the particle variables
        var particleCount = 1800
        var particles = new THREE.SphereGeometry(0.25, 32, 32)
        var pMaterial = new THREE.MeshToonMaterial({
                color: 0xFFFFFF,
            });

        var pMesh = new THREE.Mesh(particles, pMaterial)

        pMesh.position.set(0, 2, 1)
        // add it to the scene
        this.scene.add(pMesh);
    }
    private generateGUI() {
        let panel = new GUI({ width: 310 })

        let folder = panel.addFolder('Base Actions');
        let panelSettings = {
            'modify lightning': 1.0
        };
        folder.add(panelSettings, 'modify lightning', 0.0, 2, 0.01).onChange(this.editLight.bind(this));
        folder.open()

        const physicsFolder = panel.addFolder("Physics")
        physicsFolder.add(this.physicsWorld.gravity, "x", -10.0, 10.0, 0.1)
        physicsFolder.add(this.physicsWorld.gravity, "y", -10.0, 10.0, 0.1)
        physicsFolder.add(this.physicsWorld.gravity, "z", -10.0, 10.0, 0.1)
        physicsFolder.open()

        // const animationFolder = panel.addFolder("Animations")
        // console.log(this.player)
        // // function addGui(gui, name, value, callback, isColor, min, max ) {

        // this.player.animations.forEach((animation) => {
        //     console.log(animation)
        //     animationFolder.add(animation)

        // })

    }
    editLight(intensity) {
        this.mainLight.intensity = intensity
    }

    private generateStats() {
        document.body.appendChild(this.stats.dom);
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
    }

    private generateFloor() {
        const groundSize = 100

        var groundGeo = new THREE.PlaneBufferGeometry(groundSize, groundSize, groundSize / 4, groundSize / 4);
        var groundMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30,
            // wireframe: true,
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = 0;
        ground.rotateX(-Math.PI / 2)
        ground.receiveShadow = true;

        // const vertices = ground.geometry.attributes.position.array
        // const smoothing = 50
        // for (var i = 0; i <= vertices.length; i += 3) {
        //     // vertices[i+2] = 10 * Math.random() % 2;
        //     vertices[i+2] = 100 * noise(
        //         vertices[i] / smoothing, 
        //         vertices[i+1] / smoothing,
        //         vertices[i+2] / smoothing,
        //     );
        // }
        // ground.geometry.attributes.position.needsUpdate = true;
        // ground.geometry.computeVertexNormals();

        this.scene.add(ground);

        this.groundPhysicsMaterial = new Material("solidMaterial");
        var physicsContactMaterial = new ContactMaterial(this.groundPhysicsMaterial,
            this.groundPhysicsMaterial, { friction: 0, restitution: 0.1 }
        );
        physicsContactMaterial.contactEquationStiffness = 1e8;
        physicsContactMaterial.contactEquationRegularizationTime = 3;

        this.physicsWorld.addContactMaterial(physicsContactMaterial);

        // Create a floor collision
        var groundBody = new Body({
            mass: 0,
            shape: new Plane(),
            material: this.groundPhysicsMaterial
        });
        groundBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2)
        this.physicsWorld.addBody(groundBody);


    }

    private adjustCanvasSize() {
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
    }

    public render(): void {
        this.adjustCanvasSize();
        requestAnimationFrame(() => this.render())

        // this.controls.update();

        this.delta = this.clock.getDelta();

        // Player animation
        if (this.player.mixer) this.player.mixer.update(this.delta);

        this.physicsWorld.step(1 / 60);

        // Player movements
        this.player.movements()

        cubes.forEach((cube) => {
            cube.mesh.position.set(cube.body.position.x, cube.body.position.y, cube.body.position.z);
            cube.mesh.quaternion.set(cube.body.quaternion.x, cube.body.quaternion.y, cube.body.quaternion.z, cube.body.quaternion.w);
        })

        this.stats.update();

        // this.camera.lookAt(this.player.modelContainer.position);
        // this.camera.position.set(this.player.modelContainer.position.x, this.player.modelContainer.position.y + 3, this.player.modelContainer.position.z - 5)
        this.renderer.render(this.scene, this.camera);

    }
}

function noise(x, y, z) {

    var p = new Array(512)
    var permutation = [151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];
    for (var i = 0; i < 256; i++)
        p[256 + i] = p[i] = permutation[i];

    var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
        Y = Math.floor(y) & 255,                  // CONTAINS POINT.
        Z = Math.floor(z) & 255;
    x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
    y -= Math.floor(y);                                // OF POINT IN CUBE.
    z -= Math.floor(z);
    var u = fade(x),                                // COMPUTE FADE CURVES
        v = fade(y),                                // FOR EACH OF X,Y,Z.
        w = fade(z);
    var A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,      // HASH COORDINATES OF
        B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;      // THE 8 CUBE CORNERS,

    return scale(lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),  // AND ADD
        grad(p[BA], x - 1, y, z)), // BLENDED
        lerp(u, grad(p[AB], x, y - 1, z),  // RESULTS
            grad(p[BB], x - 1, y - 1, z))),// FROM  8
        lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1),  // CORNERS
            grad(p[BA + 1], x - 1, y, z - 1)), // OF CUBE
            lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
                grad(p[BB + 1], x - 1, y - 1, z - 1)))));
}
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y, z) {
    var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
    var u = h < 8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
        v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}
function scale(n) { return (1 + n) / 2; }

export default World