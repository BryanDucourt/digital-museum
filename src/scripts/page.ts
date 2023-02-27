import {
  Scene,
  PlaneGeometry,
  WebGLRenderer,
  MeshBasicMaterial,
  Mesh,
  Color,
  PerspectiveCamera,
  TextureLoader,
  RepeatWrapping,
  Camera,
  Raycaster,
  Vector2,
  Object3D,
  SphereGeometry,
  Group
} from 'three'
import { Ref } from 'vue'

export class Page {
  width: number
  height: number
  camera: Camera
  camera_above: Camera
  scene: Scene
  renderer: WebGLRenderer
  renderer_above: WebGLRenderer
  raycaster: Raycaster
  onClickPosition: Vector2
  mouse: Vector2
  inter: Mesh
  group: Group
  flag: Ref<boolean>

  constructor(flag: Ref<boolean>) {
    this.flag = flag
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.scene = new Scene()
    this.scene.background = new Color(0xeeeeee)

    this.group = new Group()
    this.scene.add(this.group)

    const interGeometry = new SphereGeometry(2)
    const interMaterial = new MeshBasicMaterial({ color: 0xff0000 })
    this.inter = new Mesh(interGeometry, interMaterial)
    this.inter.visible = false
    this.scene.add(this.inter)
    this.raycaster = new Raycaster()

    this.camera_above = new PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.camera_above.position.set(50, 50, 50)
    this.camera_above.lookAt(this.scene.position)

    this.camera = new PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.camera.position.set(0, 0, 50)
    this.camera.lookAt(this.scene.position)

    this.renderer = new WebGLRenderer()
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.domElement.style.zIndex = '1'

    this.renderer_above = new WebGLRenderer()
    this.renderer_above.setSize(this.width / 10, this.height / 10)
    this.renderer_above.setPixelRatio(window.devicePixelRatio)

    const loader = new TextureLoader()
    const planeTexture = loader.load('/uv_grid_opengl.jpg')
    planeTexture.wrapT = RepeatWrapping
    planeTexture.wrapS = RepeatWrapping

    const Geometry = new PlaneGeometry(30, 40)
    const material = new MeshBasicMaterial({ map: planeTexture })

    const left = new Mesh(Geometry, material)
    left.position.set(-15, 0, 0)
    this.group.add(left)
    const right = new Mesh(Geometry, material)
    right.position.set(15, 0, 0)
    this.group.add(right)

    this.onClickPosition = new Vector2()
    this.mouse = new Vector2()

    this.render = this.render.bind(this)
    this.getIntersects = this.getIntersects.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
  }

  getIntersects(objects: Object3D[]) {
    this.mouse.set(this.onClickPosition.x * 2 - 1, -(this.onClickPosition.y * 2) + 1)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    return this.raycaster.intersectObjects(objects, false)
  }

  render() {
    requestAnimationFrame(this.render)
    if (this.flag.value) (this.inter.material as MeshBasicMaterial).color.set(0x00ff00)
    else (this.inter.material as MeshBasicMaterial).color.set(0xff0000)
    this.renderer.render(this.scene, this.camera)
    this.renderer_above.render(this.scene, this.camera_above)
  }

  onMouseMove(evt: MouseEvent, container: Ref) {
    evt.preventDefault()
    const rect = container.value.getBoundingClientRect()
    const array = [(evt.clientX - rect.left) / rect.width, (evt.clientY - rect.top) / rect.height]
    this.onClickPosition.fromArray(array)
    const intersects = this.getIntersects(this.group.children)
    if (intersects.length > 0) {
      this.inter.visible = true
      this.inter.position.copy(intersects[0].point)
      this.inter.position.setZ(0)
    } else {
      this.inter.visible = false
    }
  }
}
