import {
  AmbientLight,
  Bone,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Float32BufferAttribute,
  LinearToneMapping,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  Skeleton,
  SkinnedMesh,
  sRGBEncoding,
  Uint16BufferAttribute,
  Vector3,
  WebGLRenderer
} from 'three'

import { Tween, update } from '@tweenjs/tween.js'

const smooth = (l: number, h: number, f: number) => {
  f = (f - l) / (h - l)
  f = Math.max(0, Math.min(1, f))
  return f * f * (3 - 2 * f)
}

interface pageProp {
  // 页面弯曲的起点,控制最终翻页完成后的弯曲形状
  earlyPivot: number
  // 页面弯曲的终点，与起点一同控制翻页完成后的性质
  latePivot: number
  // 控制起点处的弯曲区域大小
  earlyThreshold: number
  //  控制终点处的弯曲区域大小
  lateThreshold: number
  // 控制起点处的弯曲程度/力度
  earlyIntensity: number
  // 控制终点处的弯曲程度/力度
  lateIntensity: number
  // 页面物体高度
  bookHeight: number
  // 页面物体宽度
  bookWidth: number
  // 控制横向弯曲位置
  curlPivot: number
  // 控制横向弯曲影响区域的大小
  curlThreshold: number
  // 控制横向弯曲的强度/力度
  turnCurveIntensity: number
  // 书本的打开程度
  openness: number
  // 每页内容的行数
  linesPerPage: number
  // 翻页速度
  turnSpeed: number
  // 页面总数
  pageCount: number
  coverColor: string
  typeColor: string
  spineCurveIntensity: number
}

interface objectProp {
  segmentHeight: number
  segmentCount: number
  height: number
  thickness: number
  xOffset: number
  halfHeight: number
}

interface meshProp {
  mesh: SkinnedMesh
  leftPage: MeshStandardMaterial
  rightPage: MeshStandardMaterial
  curve: number
  turnCurve: number
}

interface coverProp {
  map: CanvasTexture
  metalnessMap: CanvasTexture
  normalMap: CanvasTexture
}

export class Page {
  filename: string
  loadFilename: string
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  scene: Scene
  pages: Object3D
  props: pageProp
  author: string
  textNumber: string
  language: string
  text: Array<string>
  curPage: number
  prevPage: number
  centerCurve: number
  centerTurnCurve: number
  turnAmount: number
  pagesGrid: HTMLCanvasElement | undefined
  left: meshProp | undefined
  right: meshProp | undefined
  center: meshProp | undefined
  cover: null | coverProp
  pageTurnImpulse: number
  flag: boolean
  constructor(filename: string) {
    this.filename = filename
    this.loadFilename = ''
    this.flag = false
    this.cover = null
    this.camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 20)
    this.camera.position.set(0, 3.3, 0)

    this.camera.lookAt(0, 0, 0)
    this.camera.rotateZ(-Math.PI / 2)
    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.setClearColor(0x202020)
    this.renderer.setPixelRatio(devicePixelRatio)
    this.renderer.xr.enabled = false
    const light = new AmbientLight(0xcccccc, 1.1)
    this.scene = new Scene()
    this.pageTurnImpulse = 0
    this.scene.add(light)

    setTimeout(() => {
      this.initHDR()
    }, 500)

    this.pages = new Object3D()
    this.scene.add(this.pages)
    this.pages.scale.setScalar(0.0125)
    this.pages.position.set(0, 0, 0)

    this.props = {
      earlyPivot: 2.1,
      latePivot: 17,
      earlyThreshold: 4.5,
      lateThreshold: 12.3,
      earlyIntensity: 8.4,
      lateIntensity: 0.83,
      bookHeight: 18,
      bookWidth: 12,
      curlPivot: 11,
      curlThreshold: 12,
      turnCurveIntensity: 1.4,
      openness: 0.99,
      linesPerPage: 32,
      turnSpeed: 0,
      pageCount: 119,
      coverColor: '#f81004',
      typeColor: 'goldenrod',
      spineCurveIntensity: 0
    }

    // todo add loading function here
    this.author = 'me'
    this.textNumber = '11'
    this.language = 'minion'
    this.text = []
    // this.props.pageCount = Math.ceil(this.text.length / this.props.linesPerPage / 2) * 2
    this.turnAmount = 0
    this.curPage = 0
    this.prevPage = -1
    this.centerCurve = 0
    this.centerTurnCurve = 0

    this.buildPages()

    const ticker = new Mesh(
      new PlaneGeometry(0.001, 0.001),
      new MeshBasicMaterial({ color: 'pink' })
    )
    this.scene.add(ticker)
    ticker.position.y = 1
    ticker.position.z = 0.5
    ticker.onBeforeRender = () => {
      this.curPage = Math.floor(this.turnAmount / 2) * 2
      this.centerCurve = this.center!.curve = 1 - (this.turnAmount % 2)
      this.centerTurnCurve = this.center!.turnCurve =
        2 * smooth(1, 0.0, Math.abs(this.center!.curve)) * Math.sign(-this.props.turnSpeed)
      if (this.curPage !== this.prevPage) {
        this.prevPage = this.curPage
        const currentOffset = Math.max(0.001, this.curPage / this.props.pageCount)
        const remainder = 1 - currentOffset
        const totalWidth = this.props.pageCount / 10
        requestAnimationFrame(() => {
          this.updateGeometry(
            totalWidth * currentOffset,
            -totalWidth * currentOffset * 0.5,
            this.left!.mesh
          )
          this.updateGeometry(
            totalWidth * remainder,
            totalWidth * remainder * 0.5,
            this.right!.mesh
          )

          this.setPagesFrom(
            this.curPage,
            Math.sign(this.center!.curve),
            this.left!,
            this.center!,
            this.right!
          )
        })
        // console.log(this.camera)
      }

      this.props.spineCurveIntensity =
        ((this.turnAmount - this.props.pageCount / 2) / this.props.pageCount / 2) * 0.7
      this.pages.rotation.x =
        this.pages.rotation.x * 0.9 +
        0.1 *
          (-this.props.spineCurveIntensity * Math.PI * 1.3 * this.props.openness +
            ((1 - this.props.openness) * Math.PI) / 2)
    }
  }

  setPagesFrom(
    startPos: number,
    direction: number,
    left: meshProp,
    center: meshProp,
    right: meshProp
  ) {
    left.rightPage.map = this.pageTexture(startPos, 0)
    center.leftPage.map = this.pageTexture(startPos + 1, 1)
    center.rightPage.map = this.pageTexture(startPos + 2, 0)
    right.leftPage.map = this.pageTexture(startPos + 3, 1)
  }
  pageTexture(pageNumber: number, side: number) {
    const c = document.createElement('canvas')
    c.width = c.height = 1024
    const g = c.getContext('2d')
    let grad = <CanvasGradient>{}
    if (side == 1) {
      grad = g!.createLinearGradient(0, 0, 0, 60)
    } else {
      grad = g!.createLinearGradient(0, 1024, 0, 1024 - 60)
    }
    grad.addColorStop(0, 'black')
    grad.addColorStop(1, 'white')

    g!.fillStyle = grad
    g!.fillRect(0, 0, 1024, 1024)
    g!.translate(1024, 0)
    g!.rotate(Math.PI / 2)
    g!.scale(1, this.props.bookWidth / this.props.bookHeight)
    g!.fillStyle = 'black'
    g!.font = '25px Arial'

    const leftPadder = side === 0 ? '' : new Array(120).fill(' ').join('')
    const leftGutter = side === 0 ? 30 : 80
    let lines = [leftPadder + pageNumber, '']
    if (this.text != null)
      lines = lines.concat(
        this.text.slice(
          pageNumber * this.props.linesPerPage,
          (pageNumber + 1) * this.props.linesPerPage
        )
      )
    lines.forEach((l, i) => {
      g!.fillText(l, 40 + leftGutter, 40 * (i + 1) + 40)
    })

    //  g.font = "450px Libre Baskerville";
    //  g.fillText(lines[0].split(" ")[1], 30, 900);
    const t = new CanvasTexture(c)
    if (side === 1) {
      t.rotation = Math.PI
      t.wrapS = t.wrapT = RepeatWrapping
    }
    return t
  }
  initHDR() {
    this.renderer.physicallyCorrectLights = true
    this.renderer.toneMapping = LinearToneMapping
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.toneMappingExposure = 0.3
    this.renderer.shadowMap.enabled = true
    // 设置光源
    const light = new DirectionalLight(0xdfebff, 1.75)
    light.position.set(0, 2, 1)
    light.castShadow = true
    light.shadow.mapSize.width = 256
    light.shadow.mapSize.height = 256
    light.shadow.camera.left = -0.13
    light.shadow.camera.right = 0.13
    light.shadow.camera.top = 0.2
    light.shadow.camera.bottom = -0.2

    light.shadow.camera.near = 0.8
    light.shadow.camera.far = 1.2
    this.scene.add(light)
  }

  buildPages() {
    // 若触发重新绘制，清空原有的页面
    while (this.pages.children.length > 0) this.pages.remove(this.pages.children[0])

    const currentOffset = Math.max(0.001, this.curPage / this.props.pageCount)
    const remainder = 1 - currentOffset
    const totalWidth = this.props.pageCount / 10

    this.left = this.createPage(totalWidth * currentOffset, -totalWidth * currentOffset * 0.5)
    this.right = this.createPage(totalWidth * remainder, totalWidth * remainder * 0.5)
    this.center = this.createPage(0.01, 0)
    this.center.mesh.receiveShadow = false
    const pageParts = this.coverPage()
    this.left.leftPage.map = pageParts.map
    this.left.leftPage.metalness = this.left.leftPage.roughness = 1
    this.left.leftPage.metalnessMap = this.left.leftPage.roughnessMap = pageParts.metalnessMap
    this.left.leftPage.normalMap = pageParts.normalMap

    this.left.curve = -1
    this.right.curve = 1
    this.center.curve = this.centerCurve
    this.center.turnCurve = this.centerTurnCurve
    this.pages.add(this.left.mesh)
    this.pages.add(this.right.mesh)
    this.pages.add(this.center.mesh)

    this.right.mesh.position.y = this.left.mesh.position.y = this.center.mesh.position.y = 57
    this.right.mesh.position.z =
      this.left.mesh.position.z =
      this.center.mesh.position.z =
        (currentOffset - 0.5) * totalWidth
  }

  coverPage() {
    if (this.cover === null || this.filename !== this.loadFilename) {
      this.filename = this.loadFilename
      const c = document.createElement('canvas')
      c.width = c.height = 1024
      const aspect = this.props.bookWidth / this.props.bookHeight
      const g = c.getContext('2d')
      const gold = this.props.typeColor
      g!.fillStyle = this.props.coverColor
      g!.fillRect(0, 0, 1024, 1024)

      const orm = document.createElement('canvas')
      orm.width = orm.height = 1024
      const ormC = orm.getContext('2d')
      ormC!.fillStyle = 'rgb(0,80,0)'
      ormC!.fillRect(0, 0, 1024, 1024)

      for (let i = 0; i < 20; i++) {
        const rx = Math.random() * 1024
        const ry = Math.random() * 1024
        const radialGrad = ormC!.createRadialGradient(rx, ry, 0, rx, ry, 400 + Math.random() * 100)
        const rough = Math.floor(32 + Math.random() * 223)
        radialGrad.addColorStop(0, `rgba(0,${rough},0,0.25)`)
        radialGrad.addColorStop(1, `rgba(0,${rough},0,0)`)

        ormC!.fillStyle = radialGrad
        ormC!.fillRect(0, 0, 1024, 1024)
      }
      const bumpC = document.createElement('canvas')
      bumpC.width = bumpC.height = 1024
      const bumpG = bumpC.getContext('2d')

      bumpG!.fillStyle = 'gray'
      bumpG!.fillRect(0, 0, 1024, 1024)

      g!.scale(1, aspect)
      ormC!.scale(1, aspect)
      bumpG!.scale(1, aspect)

      g!.fillStyle = gold
      g!.font = '700 80px Libre Baskerville'

      g!.strokeStyle = gold
      g!.lineWidth = 8
      g!.lineJoin = 'round'
      g!.lineCap = 'square'

      this.drawBorder(g!, aspect)

      ormC!.lineWidth = 8
      ormC!.lineJoin = 'round'
      ormC!.lineCap = 'square'
      ormC!.strokeStyle = 'rgb(0,30,255)'

      bumpG!.lineWidth = 8
      bumpG!.lineJoin = 'round'
      bumpG!.lineCap = 'square'
      bumpG!.strokeStyle = 'rgb(255, 30,255)'

      this.drawBorder(ormC!, aspect)
      this.drawBorder(bumpG!, aspect)

      const title = this.filename
      ormC!.fillStyle = 'rgb(0,50,255)'
      ormC!.font = '700 80px Libre Baskerville'

      bumpG!.shadowColor = 'rgba(255,255,255,1)'
      bumpG!.shadowBlur = 3
      const shadowOffset = 2000

      bumpG!.shadowOffsetX = 0
      bumpG!.shadowOffsetY = shadowOffset + aspect
      bumpG!.fillStyle = 'black'
      bumpG!.font = '700 80px Libre Baskerville'

      const w = g!.measureText(title).width
      ormC!.fillText(title, 512 - w / 2, 512 / aspect)
      g!.fillText(title, 512 - w / 2, 512 / aspect)
      bumpG!.fillText(title, 512 - w / 2, 512 / aspect)

      const tex = (canvas: TexImageSource) => {
        const t = new CanvasTexture(canvas)
        t.wrapS = t.wrapT = RepeatWrapping
        t.rotation = Math.PI / 2
        return t
      }
      this.cover = {
        map: tex(c),
        metalnessMap: tex(orm),
        normalMap: tex(this.bumpToNormal(bumpC, 1, 0.5))
      }
    }
    return this.cover
  }

  bumpToNormal(canvas: HTMLCanvasElement, offset = 1, intensity = 1) {
    const g = canvas.getContext('2d')
    const src = g!.getImageData(0, 0, canvas.width, canvas.height)
    const dest = g!.getImageData(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < src.data.length; i += 4) {
      const red = (src.data[i] - src.data[i + 4 * offset]) * intensity
      const green = (src.data[i] - src.data[i + 4 * offset * canvas.width]) * intensity
      const blue = 255 - Math.abs(red) - Math.abs(green)

      dest.data[i] = 128 + red
      dest.data[i + 1] = 128 + green
      dest.data[i + 2] = blue
      dest.data[i + 3] = 255
    }

    g!.putImageData(dest, 0, 0)

    return canvas
  }
  drawBorder(g: CanvasRenderingContext2D, aspect: number) {
    const borderString = new Path2D(
      'M121.05,116.02c0,0,0-23.72,0-41.47s0-44.96,0-44.96H34.62M93.05,86.02c0,0,93.59,0,103.98,0s91.8,0,91.8,0V30.15h259.52M0,0.5h97.36v64.66c0,0,29.26,0,41.39,0c12.12,0,35.89,0,35.89,0V0.5h566.22'
    )
    const margin = 40
    const scale = 0.55

    g.save()
    g.scale(scale, scale)
    g.save()
    g.translate(margin, margin)
    g.stroke(borderString)
    g.restore()

    g.save()
    g.translate(margin, margin)
    g.rotate(Math.PI / 2)
    g.scale(1, -1)
    g.stroke(borderString)
    g.restore()

    g.save()
    g.translate(1024 / scale - margin, margin)
    g.scale(-1, 1)
    g.stroke(borderString)
    g.restore()

    g.save()
    g.translate(1024 / scale - margin, margin)
    g.rotate(-Math.PI / 2)
    g.scale(-1, -1)
    g.stroke(borderString)
    g.restore()

    g.translate(0, 1024 / scale / aspect)
    g.scale(1, -1)
    g.save()
    g.translate(margin, margin)
    g.stroke(borderString)
    g.restore()

    g.save()
    g.translate(margin, margin)
    g.rotate(Math.PI / 2)
    g.scale(1, -1)
    g.stroke(borderString)
    g.restore()

    g.save()
    g.translate(1024 / scale - margin, margin)
    g.scale(-1, 1)
    g.stroke(borderString)
    g.restore()

    g.save()
    g.translate(1024 / scale - margin, margin)
    g.rotate(-Math.PI / 2)
    g.scale(-1, -1)
    g.stroke(borderString)
    g.restore()

    g.restore()
  }

  updateGeometry(thickness: number, offset: number, mesh: SkinnedMesh) {
    thickness = Math.max(0.01, thickness)
    const segHeight = 6
    const segCount = 20
    const height = segHeight * segCount
    const heightHalf = height * 0.5
    const sizingProp = {
      segmentHeight: segHeight,
      segmentCount: segCount,
      height: height,
      thickness: thickness,
      xOffset: offset,
      halfHeight: heightHalf
    }
    mesh.geometry.dispose()
    mesh.geometry = this.createGeometry(sizingProp)
  }
  createPage(thickness: number, offset: number) {
    thickness = Math.max(0.01, thickness)
    const segHeight = 6
    const segCount = 20
    const height = segHeight * segCount
    const heightHalf = height * 0.5
    const sizingProp = {
      segmentHeight: segHeight,
      segmentCount: segCount,
      height: height,
      thickness: thickness,
      xOffset: offset,
      halfHeight: heightHalf
    }

    const geometry = this.createGeometry(sizingProp)
    const bones = this.createBones(sizingProp)

    const mesh = this.createMesh(geometry, bones)

    const mesh_obj: meshProp = {
      mesh,
      curve: 0,
      turnCurve: 0,
      leftPage: <MeshStandardMaterial>{},
      rightPage: <MeshStandardMaterial>{}
    }
    mesh_obj.mesh.onBeforeRender = () => {
      bones.forEach((b, i) => {
        // 计算到达
        const distToEarlyCurve = Math.abs(i - this.props.earlyPivot)
        let distToLateCurve = Math.abs(i - this.props.latePivot)
        const earlyCurveContribution = smooth(this.props.earlyThreshold, 0, distToEarlyCurve)
        const lateCurveContribution = smooth(this.props.lateThreshold, 0, distToLateCurve)
        distToLateCurve = Math.abs(i - this.props.curlPivot)
        const curlCurveContribution = smooth(this.props.curlThreshold, 0, distToLateCurve)
        const spineCurveContribution = smooth(7, 1, i)
        b.rotation.x =
          (this.props.earlyIntensity / 20) *
            earlyCurveContribution *
            mesh_obj.curve *
            this.props.openness -
          (this.props.lateIntensity / 20) *
            lateCurveContribution *
            mesh_obj.curve *
            this.props.openness +
          (this.props.turnCurveIntensity / 20) *
            curlCurveContribution *
            mesh_obj.turnCurve *
            this.props.openness
        b.rotation.y =
          -Math.sign(this.props.turnSpeed) *
          (0.15 * b.rotation.x * mesh_obj.turnCurve * curlCurveContribution)
        b.rotation.x +=
          this.props.spineCurveIntensity * spineCurveContribution * this.props.openness
      })
    }
    mesh_obj.leftPage = mesh.material[5]
    mesh_obj.rightPage = mesh.material[4]
    return mesh_obj
  }

  createMesh(geometry: BufferGeometry, bones: Bone[]) {
    const bgX = new MeshStandardMaterial({ map: this.bookGrid(0) })
    const bgNY = new MeshStandardMaterial({ map: this.bookGrid(-Math.PI / 2) })
    const red = new MeshStandardMaterial({ color: this.props.coverColor })
    const bgY = new MeshStandardMaterial({ map: this.bookGrid(Math.PI / 2) })
    const materials = [bgNY, bgY, bgX, red]

    for (let i = 0; i < 2; i++) {
      const material = new MeshStandardMaterial({
        map: this.blankTexture(),
        roughness: 0.5,
        metalness: 0
      })
      materials.push(material)
    }
    const mesh = new SkinnedMesh(geometry, materials)
    const skeleton = new Skeleton(bones)

    mesh.add(bones[0])
    mesh.bind(skeleton)
    mesh.castShadow = true
    mesh.receiveShadow = true

    return mesh
  }
  blankTexture() {
    const c = document.createElement('canvas')
    const g = c.getContext('2d')
    c.width = c.height = 4

    g!.fillStyle = this.props.coverColor
    g!.fillRect(0, 0, 4, 4)

    return new CanvasTexture(c)
  }
  bookGrid(angle: number) {
    if (this.pagesGrid == null) {
      const c = document.createElement('canvas')
      c.width = c.height = 1024
      const g = c.getContext('2d')

      g!.fillStyle = 'gray'
      g!.fillRect(0, 0, 1024, 1024)
      g!.globalAlpha = 1
      for (let i = 0; i < 1e2; i++) {
        g!.fillStyle = `hsl(0,10%,${Math.floor(Math.random() * 10 + 70)}%`
        g!.fillRect(0, Math.random() * 1024, 1024, 15)
      }
      this.pagesGrid = c
    }
    const t = new CanvasTexture(this.pagesGrid)
    t.rotation = angle
    t.wrapS = t.wrapT = RepeatWrapping
    return t
  }
  createBones(prop: objectProp) {
    const bones = []
    let pBone = new Bone()
    bones.push(pBone)
    pBone.position.y = -prop.halfHeight

    for (let i = 0; i < prop.segmentCount; i++) {
      const bone = new Bone()
      bone.position.y = prop.segmentHeight
      bones.push(bone)
      pBone.add(bone)
      pBone = bone
    }

    return bones
  }
  createGeometry(prop: objectProp) {
    const geometry = new BoxGeometry(
      10 * this.props.bookHeight,
      prop.height,
      prop.thickness,
      2,
      prop.segmentCount * 5
    )
    for (let n = 0; n < (geometry.attributes.position as BufferAttribute).count; n += 1) {
      ;(geometry.attributes.position as BufferAttribute).setZ(
        n,
        (geometry.attributes.position as BufferAttribute).getZ(n) + prop.xOffset
      )
    }
    const position = geometry.attributes.position as BufferAttribute
    const vertex = new Vector3()
    const skinIndices = []
    const skinWeights = []

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)
      const y = vertex.y + prop.halfHeight
      const skinIndex = Math.floor(y / prop.segmentHeight)
      const skinWeight = (y % prop.segmentHeight) / prop.segmentHeight
      skinIndices.push(skinIndex, skinIndex + 1, 0, 0)
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
    }
    geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4))
    geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4))

    return geometry
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    update()
  }

  nextPage() {
    const tween = new Tween({ amt: this.turnAmount, spd: 0 })
    tween.to({ amt: this.turnAmount + 2, spd: [0.3, 0] }, 2000)
    tween.onUpdate((obj) => {
      this.turnAmount = obj.amt
      this.props.turnSpeed = obj.spd
    })
    tween.start()
  }

  previousPage() {
    const tween = new Tween({ amt: this.turnAmount, spd: 0 })
    tween.to({ amt: this.turnAmount - 2, spd: [0.3, 0] }, 2000)
    tween.onUpdate((obj) => {
      this.turnAmount = obj.amt
      this.props.turnSpeed = obj.spd
    })
    tween.start()
  }
}

export default Page
