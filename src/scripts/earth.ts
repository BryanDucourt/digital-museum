import {
  AmbientLight,
  Scene,
  WebGLRenderer,
  Mesh,
  Color,
  PerspectiveCamera,
  TextureLoader,
  Camera,
  SphereGeometry,
  Vector3,
  BufferGeometry,
  Fog,
  DirectionalLight,
  HemisphereLight,
  Float32BufferAttribute,
  PointsMaterial,
  AdditiveBlending,
  Points,
  MeshStandardMaterial,
  AxesHelper
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
export class Earth {
  width: number
  height: number
  camera: Camera
  scene: Scene
  renderer: WebGLRenderer
  control: OrbitControls
  curpos: Vector3

  constructor() {
    this.width = window.innerWidth * 0.35
    this.height = window.innerHeight * 0.5
    this.curpos = new Vector3(0, 0, 60)

    this.scene = new Scene()
    this.scene.background = new Color(0x020924)
    this.scene.fog = new Fog(0x020924, 200, 1000)

    this.camera = new PerspectiveCamera(45, this.width / this.height, 1, 10000)
    this.camera.position.set(0, 0, 200)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)

    this.control = new OrbitControls(this.camera, this.renderer.domElement)
    this.control.enableDamping = true
    this.control.enableZoom = true
    this.control.autoRotate = false
    this.control.enablePan = true
    const axesHelper = new AxesHelper(150)
    this.scene.add(axesHelper)
    // 创建环境光
    const light = new AmbientLight(0xcccccc, 1.1)
    // 创建平行光以投射阴影
    const d_light = new DirectionalLight(0xffffff, 0.2)
    d_light.position.set(1, 0.1, 0).normalize()

    const h_light = new HemisphereLight(0xffffff, 0x444444, 0.2)
    h_light.position.set(0, 1, 0)

    const d_light_2 = new DirectionalLight(0xffffff)
    d_light_2.position.set(1, 500, -20)
    d_light_2.castShadow = true
    d_light_2.shadow.camera.top = 18
    d_light_2.shadow.camera.bottom = -10
    d_light_2.shadow.camera.left = -52
    d_light_2.shadow.camera.right = 12
    const d_light_3 = new DirectionalLight(0xffffff, 0.2)
    d_light_3.position.set(1, 0.1, 0.1).normalize()
    this.scene.add(light)
    this.scene.add(d_light)
    this.scene.add(h_light)
    this.scene.add(d_light_2)
    this.scene.add(d_light_3)
    this.initBackGround()
    this.initEarth()
    this.animate = this.animate.bind(this)
  }

  render() {
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera)
  }

  animate() {
    this.control.update()
    this.render()
  }

  initBackGround() {
    const dot_pos = []
    const dot_color = []
    const geometry = new BufferGeometry()
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const z = Math.random() * 2 - 1

      dot_pos.push(x, y, z)
      const color = new Color()
      color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55)
      dot_color.push(color.r, color.g, color.b)
    }
    geometry.setAttribute('position', new Float32BufferAttribute(dot_pos, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(dot_color, 3))

    const background_material = new PointsMaterial({
      size: 1,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      blending: AdditiveBlending,
      sizeAttenuation: true
    })
    const back_ground = new Points(geometry, background_material)
    back_ground.scale.set(300, 300, 300)
    this.scene.add(back_ground)
  }

  initEarth() {
    const loader = new TextureLoader()
    const earth_texture = loader.load('/earth.jpeg')
    const geometry = new SphereGeometry(60, 100, 100)
    const material = new MeshStandardMaterial({ map: earth_texture })
    const earth_mesh = new Mesh(geometry, material)
    earth_mesh.position.set(0, 0, 0)
    // console.log(Math.asin((pos.x - this.curpos.x) / 60))
    this.scene.add(earth_mesh)
  }

  // lg2xyz(longitude: number, latitude: number, radius: number) {
  //   const phi = (180 + Number(longitude)) * (Math.PI / 180)
  //   const theta = (90 - Number(latitude)) * (Math.PI / 180)
  //   return {
  //     x: -radius * Math.sin(theta) * Math.cos(phi),
  //     y: radius * Math.cos(theta),
  //     z: radius * Math.sin(theta) * Math.sin(phi)
  //   }
  // }

  // rotate(longitude: number, latitude: number) {
  //   const pos = this.lg2xyz(longitude, latitude, 60)
  //
  //   this.camera.position.set((pos.x / 60) * 200, (pos.y / 60) * 200, (pos.z / 60) * 200)
  // }
}
