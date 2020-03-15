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
let boxes = [], room

// UI
let cubeDelay = 0

// Stats.js
let stats

class Home extends React.Component {

  constructor(props) {
    super(props)

    this.gravityX = 0
    this.gravityY = -10
    this.rotateGravity = false
    this.hasToAddBox = false
    this.rotate = false
    this.rotateSpeed = 0.01
    this.rotateGravitySpeed = 0.001
    this.rotateGravityAmplitude = 1

    this.canvas = React.createRef()
    this.animate = this.animate.bind(this)
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
    const gravityFolder = gui.addFolder('gravity')
    gravityFolder.add(this, 'gravityX', -10, 10).step(.1).listen()
    gravityFolder.add(this, 'gravityY', -10, 10).step(.1).listen()
    gravityFolder.add(this, 'rotateGravity').name('auto rotate')
    gravityFolder.add(this, 'rotateGravitySpeed', 0.0001, 0.005).name('speed')
    gravityFolder.add(this, 'rotateGravityAmplitude', 1, 10).name('amplitude')
    gravityFolder.open()

    const boxesFolder = gui.addFolder('boxes')
    boxesFolder.add(this, 'hasToAddBox').name('stream boxes')
    boxesFolder.add(this, 'addBox')
    boxesFolder.open()
    
    const controlsFolder = gui.addFolder('controls')
    controlsFolder.add(controls, 'enabled')
    controlsFolder.add(controls, 'reset')
    controlsFolder.open()

    const roomFolder = gui.addFolder('room')
    roomFolder.add(this, 'rotate')
    roomFolder.add(this, 'reset')
    roomFolder.add(this, 'rotateSpeed', -.1, .1).step(.01).name('speed')
    roomFolder.open()

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
    room = new THREE.Object3D()
    scene.add(room)

    const back = new THREE.Mesh(planeGeom, planeMat)
    back.position.z = -width
    room.add(back)

    const front = new THREE.Mesh(planeGeom, planeMat)
    front.rotation.y = Math.PI
    room.add(front)

    const left = new THREE.Mesh(planeGeom, planeMat)
    left.position.z = -width / 2
    left.position.x = -width / 2
    left.rotation.y = Math.PI / 2
    room.add(left)

    const right = new THREE.Mesh(planeGeom, planeMat)
    right.position.z = -width / 2
    right.position.x = width / 2
    right.rotation.y = -Math.PI / 2
    room.add(right)

    const top = new THREE.Mesh(planeGeom2, planeMat)
    top.position.z = -width / 2
    top.position.y = height / 2
    top.rotation.x = Math.PI / 2
    room.add(top)

    const bottom = new THREE.Mesh(planeGeom2, planeMat)
    bottom.position.z = -width / 2
    bottom.position.y = -height / 2
    bottom.rotation.x = -Math.PI / 2
    room.add(bottom)

    const body = new CANNON.Body({mass: 0})
    const shape = new CANNON.Plane()

    const bottomQuaternion = new CANNON.Quaternion()
    bottomQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    body.addShape(shape, new CANNON.Vec3(0, -height/2, 0), bottomQuaternion)

    const topQuaternion = new CANNON.Quaternion()
    topQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2)
    body.addShape(shape, new CANNON.Vec3(0, height/2, 0), topQuaternion)

    const leftQuaternion = new CANNON.Quaternion()
    leftQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2)
    body.addShape(shape, new CANNON.Vec3(-width/2, 0, 0), leftQuaternion)

    const rigthQuaternion = new CANNON.Quaternion()
    rigthQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
    body.addShape(shape, new CANNON.Vec3(width/2, 0, 0), rigthQuaternion)

    const frontQuaternion = new CANNON.Quaternion()
    frontQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI)
    body.addShape(shape, new CANNON.Vec3(), frontQuaternion)

    body.addShape(shape, new CANNON.Vec3(0, 0, -width))

    room.body = body
    world.add(room.body)
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

    if (this.rotate) {
      const axisAngle = room.body.quaternion.toAxisAngle()
      let rotateY = axisAngle[1] + this.rotateSpeed
      if (rotateY >= 2 * Math.PI) {
        rotateY = 0
      }

      // console.log(axisAngle)
      room.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), rotateY)
    }

    if (this.rotateGravity) {
      this.gravityX = Math.cos(time * this.rotateGravitySpeed) * this.rotateGravityAmplitude
      this.gravityY = Math.sin(time * this.rotateGravitySpeed) * this.rotateGravityAmplitude
    }

    room.position.copy(room.body.position)
    room.quaternion.copy(room.body.quaternion)

    world.gravity.set(this.gravityX, this.gravityY, 0)

    boxes.forEach(mesh => {
      mesh.position.copy(mesh.body.position)
      mesh.quaternion.copy(mesh.body.quaternion)
    })

    controls.update()

    const dt = (time - lastTime) / 1000
    world.step(1/60, dt, 3)
    lastTime = time
  }

  reset() {
    room.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 0), 0)
  }

  render() {
    return (
      <div className={styles.container}>
        <canvas ref={el => { this.canvas = el }}/>
      </div>
    )
  }
}

export default Home;