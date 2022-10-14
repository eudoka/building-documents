import './style.css'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import * as dat from 'dat.gui'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import { Mesh, sRGBEncoding, ToneMapping } from 'three'

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

//debug
const gui = new dat.GUI({name:'settings',width:300})
console.log(gui)

// Canvas
const canvas = document.querySelector('canvas.webgl')

//loaders
const loadingBarElement = document.querySelector('.loading-bar')
const informTextElement = document.querySelector('.informtext')

const loadingManager = new THREE.LoadingManager(
    //loaded
    ()=>
    {
        window.setTimeout(()=>
        {
            gsap.to(overlayMaterial.uniforms.uAlpha,{duration:3,value:0,delay:1})
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        },500)
        renderer.setClearColor('#b4b4b4')
        
    },
    //progress
    (itemUrl,itemsLoaded,itemsTotal)=>
    {
        const progressRotio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRotio})`
        //console.log(itemUrl,itemsLoaded,itemsTotal)
    }

)

// Scene
const scene = new THREE.Scene()

//overlay
const overlayGeometry = new THREE.PlaneGeometry(1,1,1,1)

const overlayMaterial = new THREE.ShaderMaterial({
    transparent:true,
    uniforms:
    {
        uAlpha:{value:1}
    },
    vertexShader:`
    void main()
    {
        gl_Position = vec4(position,1.0);
    }
    `,
    fragmentShader:`
    uniform float uAlpha;
    void main()
    {
        gl_FragColor = vec4(0.0,0.0,0.0,uAlpha);
    }
    `

})

const overlay = new Mesh(overlayGeometry,overlayMaterial)

//texture
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
const environmentMapTexture = cubeTextureLoader.load([
    '/texture/environmentMaps/2/px.jpg',
    '/texture/environmentMaps/2/nx.jpg',
    '/texture/environmentMaps/2/py.jpg',
    '/texture/environmentMaps/2/ny.jpg',
    '/texture/environmentMaps/2/pz.jpg',
    '/texture/environmentMaps/2/nz.jpg'
])

const updataAllMaterials = ()=>{
    scene.traverse((child)=>{
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial){
            child.material.envMap = environmentMapTexture
        }

    })
}


//material
const glassmaterial = new THREE.MeshStandardMaterial()
glassmaterial.metalness = 0.3
glassmaterial.roughness = 0
glassmaterial.transparent = true
glassmaterial.opacity = 0.3
glassmaterial.envMap = environmentMapTexture

//light
//const ambientlight = new THREE.AmbientLight(0xffffff,0)
//scene.add(ambientlight)
const directionalLight = new THREE.DirectionalLight(0xffffff,2)
directionalLight.position.set(15,25,-20)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(4096,4096)
//directionalLight.shadow.radius =15
directionalLight.shadow.camera.top = 32
directionalLight.shadow.camera.bottom = -20
directionalLight.shadow.camera.right = 35
directionalLight.shadow.camera.left = -35
directionalLight.shadow.camera.near = 7
directionalLight.shadow.camera.far = 68
directionalLight.shadow.normalBias = 0.5
scene.add(directionalLight)

gui.add(directionalLight,'intensity',2).min(0).max(5).step(0.1).name('SunLightintensity')

//fog
const fog = new THREE.Fog('#b4b4b4',45,80)
scene.fog = fog

//helpers
//const directionalLightHelper00 = new THREE.DirectionalLightHelper(directionalLight,10)
//const directionalLightHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
//scene.add(directionalLightHelper)

//models
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.load(
    '/model/model.gltf',
    (gltf)=>
    {
        gltf.scene.scale.set(5,5,5)
        gltf.scene.traverse((child)=>
        {
            child.castShadow = true
            child.receiveShadow = true            
        })
        
        const glassmesh01 = gltf.scene.children.find(child => child.name === 'bulding_01' )
        glassmesh01.children[2].material = glassmaterial
        const glassmesh02 = gltf.scene.children.find(child => child.name === 'bulding_00_whole' )
        glassmesh02.children[13].material = glassmaterial
        const planemesh = gltf.scene.children.find(child => child.name === 'Plane001' )
        //planemesh.position.setY(0.01)
        console.log(gltf.scene)
        scene.add(gltf.scene)

        updataAllMaterials()
    }
)



loadingManager.onError = () =>
{
    informTextElement.style.opacity = 1
}

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = -35
camera.position.x = 15
camera.position.y = 5



scene.add(camera)

//control
const controls = new OrbitControls(camera,canvas)
controls.enableDamping = true


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias:true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//scene.background = environmentMapTexture
//renderer.setClearColor('#b4b4b4')
//renderer.setClearColor('#FFFFFF')
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
//renderer.toneMapping = THREE.ACESFilmicToneMapping


//animation
const clock = new THREE.Clock()
const tick=()=>
{
    //const elapsedTime = clock.getElapsedTime()
    stats.begin()

    //updata camera
    controls.update()
    //render
    renderer.render(scene, camera)
    //call tick again on the next frame
    window.requestAnimationFrame(tick)

    stats.end()
}
tick()