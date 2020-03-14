import React from 'react'
import styles from './Home.css'
import * as THREE from 'three'
import * as CANNON from 'cannon'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats.js'
import dat from 'dat.gui'

// THREE
let scene, camera, renderer, controls

// CANNON
let world, lastTime

// Mixed
let boxes = []

// UI
let cubeDelay = 0

// Stats.js
let stats

class Home extends React.Component {

  constructor(props) {
    super(props)

    this.gravity = -10
    this.hasToAddBox = false

    this.canvas = React.createRef()
    this.animate = this.animate.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
  }

  componentDidMount() {
    this.init()
    this.animate()
  }

  init() {
    // THREE

    renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas})
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(devicePixelRatio)

    scene = new THREE.Scene()

    const pointLight = new THREE.PointLight(0xffffff, .4)
    scene.add(pointLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, .6)
    scene.add(ambientLight)
    
    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 1000)
    camera.position.set(0, 0, 2)
    controls = new OrbitControls(camera, this.canvas)
    controls.enabled = false

    scene.add(new THREE.AxesHelper())

    // CANNON

    world = new CANNON.World()
    world.broadphase = new CANNON.NaiveBroadphase()
    world.gravity.set(0, 1, 0)

    // Stats.js
    stats = new Stats()
    document.body.appendChild(stats.domElement)

    // Dat.gui
    const gui = new dat.GUI()
    gui.add(this, 'gravity', -10, 10)

    const boxesFolder = gui.addFolder('boxes')
    boxesFolder.add(this, 'hasToAddBox').name('stream boxes')
    boxesFolder.add(this, 'addBox')

    const controlsFolder = gui.addFolder('controls')
    controlsFolder.add(controls, 'enabled')
    controlsFolder.add(controls, 'reset')

    this.addRoom()
  }

  addRoom() {
    const adjacent = camera.position.z
    const hypothenuse = adjacent / Math.cos(camera.fov / 2 * Math.PI / 180)
    const opposite = Math.sqrt(Math.pow(hypothenuse, 2) - Math.pow(adjacent, 2))
    const height = opposite * 2
    const width = height * camera.aspect

    const planeGeom = new THREE.PlaneBufferGeometry(width, height)
    const planeGeom2 = new THREE.PlaneBufferGeometry(width, width)
    const planeMat = new THREE.MeshPhongMaterial({color: 0xffffff})

    const back = new THREE.Mesh(planeGeom, planeMat)
    back.position.z = -width
    scene.add(back)

    const front = new THREE.Mesh(planeGeom, planeMat)
    front.visible = false
    scene.add(front)

    const left = new THREE.Mesh(planeGeom, planeMat)
    left.position.z = -width / 2
    left.position.x = -width / 2
    left.rotation.y = Math.PI / 2
    scene.add(left)

    const right = new THREE.Mesh(planeGeom, planeMat)
    right.position.z = -width / 2
    right.position.x = width / 2
    right.rotation.y = -Math.PI / 2
    scene.add(right)

    const top = new THREE.Mesh(planeGeom2, planeMat)
    top.position.z = -width / 2
    top.position.y = height / 2
    top.rotation.x = Math.PI / 2
    scene.add(top)

    const bottom = new THREE.Mesh(planeGeom2, planeMat)
    bottom.position.z = -width / 2
    bottom.position.y = -height / 2
    bottom.rotation.x = -Math.PI / 2
    scene.add(bottom)

    const bottomBody = new CANNON.Body({mass: 0})
    const shape = new CANNON.Plane()
    bottomBody.addShape(shape)
    bottomBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    bottomBody.position.set(0, -height/2, 0)
    world.add(bottomBody)

    const topBody = new CANNON.Body({mass: 0})
    topBody.addShape(shape)
    topBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2)
    topBody.position.set(0, height/2, 0)
    world.add(topBody)

    const leftBody = new CANNON.Body({mass: 0})
    leftBody.addShape(shape)
    leftBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2)
    leftBody.position.set(-width/2, 0, 0)
    world.add(leftBody)

    const rightBody = new CANNON.Body({mass: 0})
    rightBody.addShape(shape)
    rightBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
    rightBody.position.set(width/2, 0, 0)
    world.add(rightBody)

    const frontBody = new CANNON.Body({mass: 0})
    frontBody.addShape(shape)
    frontBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI)
    world.add(frontBody)

    const backBody = new CANNON.Body({mass: 0})
    backBody.addShape(shape)
    backBody.position.set(0, 0, -width)
    world.add(backBody)
  }

  addBox() {
    const size = .4
    const body = new CANNON.Body({mass: 1})
    const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2))
    body.addShape(shape)
    body.position.set(0, 1, -2.5)
    world.add(body)

    const geo = new THREE.BoxGeometry(size, size, size)
    const mat = new THREE.MeshPhongMaterial({color: 0xff0000})
    const mesh = new THREE.Mesh(geo, mat)
    mesh.body = body
    scene.add(mesh)

    boxes.push(mesh)
  }

  animate(time) {
    requestAnimationFrame(this.animate)
    
    stats.begin()
    this.update(time)

    renderer.render(scene, camera)
    stats.end()
  }

  update(time) {
    if (this.hasToAddBox) {
      if (!cubeDelay) {
        this.addBox()
        cubeDelay = 10
      } else {
        cubeDelay--
      }
    }

    world.gravity.set(0, this.gravity, 0)

    boxes.forEach(mesh => {
      mesh.position.copy(mesh.body.position)
      mesh.quaternion.copy(mesh.body.quaternion)
    })

    // plane.position.copy(plane.body.position)
    // plane.quaternion.copy(plane.body.quaternion)
    controls.update()

    const dt = (time - lastTime) / 1000
    world.step(1/60, dt, 3)
    lastTime = time
  }

  handleMouseDown(e) {
    this.hasToAddBox = true
  }
  
  handleMouseUp(e) {
    this.hasToAddBox = false
  }

  render() {
    return (
      <div className={styles.container}>
        <canvas ref={el => { this.canvas = el }} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}/>
      </div>
    )
  }
}

export default Home;