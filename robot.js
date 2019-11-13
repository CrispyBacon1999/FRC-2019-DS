var model = $("#robot-model");

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
  75,
  model.width() / model.height(),
  0.1,
  1000
);
scene.background = new THREE.Color(0x000000);
scene.add(new THREE.AmbientLight(0xaaaaaa));
var light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(50, 50, 50);
scene.add(light);

var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(model.width(), model.height());
document.getElementById("robot-model").appendChild(renderer.domElement);

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = model.width() / model.height();
  camera.updateProjectionMatrix();

  renderer.setSize(model.width(), model.height());
}

class Renderable {
  constructor(color) {
    this.color = color;
    this.material = new THREE.MeshToonMaterial({ color: this.color });
    this.model = new THREE.BoxGeometry(1, 1, 1);
  }

  Mesh = null;
  attach = scene => {
    if (this.Mesh) {
      scene.add(this.Mesh);
    }
  };
  color = 0x333333;

  getMaterial() {
    return this.material;
  }

  getModel = () => {
    return this.model;
  };

  update = () => {};
}

class Elevator extends Renderable {
  currentHeight = 0;
}
class Hatch extends Renderable {
  upper_angle = -60;
  lower_angle = 0;
  is_in_position = false;
  offsetY = 9;
  rotation = 0;
  target_pos = [-20, 30, 0];
  constructor(color) {
    super(0xff0000);
    this.model = new THREE.BoxGeometry(15, 4, 4);
    this.pivot = new THREE.Group();
    this.mesh = new THREE.Mesh(this.getModel(), this.getMaterial());
    this.mesh.position.set(-7.5, 0, 0);
    this.pivot.position.set(...this.target_pos);
  }

  attach = scene => {
    console.log("Attach Hatch");
    scene.add(this.mesh);
    scene.add(this.pivot);
    this.pivot.add(this.mesh);
  };

  target_angle = () => {
    return this.is_in_position ? this.lower_angle : this.upper_angle;
  };

  update = () => {
    this.pivot.rotation.z = THREE.Math.degToRad(this.target_angle());
  };
}
class CargoBowl extends Renderable {
  offsetY = 6;
}
class CargoArm extends Renderable {
  offsetY = 8;
  rotation = 0;
}

class Robot extends Renderable {
  constructor() {
    super();
    this.elevator = new Elevator();
    this.cargoBowl = new CargoBowl();
    this.cargoArm = new CargoArm();
    this.hatch = new Hatch();
    this.Mesh = new THREE.Mesh(this.getModel(), this.getMaterial());
    this.ElevatorShaftMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 96, 30),
      new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        transparency: 0.5,
        transparent: true
      })
    );
    this.ElevatorShaftMesh.position.set(-19, 96 / 2 + 3, 0);
  }

  model = new THREE.BoxGeometry(40, 6, 30);

  getMesh = () => {
    return this.Mesh;
  };

  getElevatorMesh = () => {
    return this.ElevatorShaftMesh;
  };

  attach = scene => {
    scene.add(this.getMesh());
    scene.add(this.getElevatorMesh());
    this.elevator.attach(scene);
    this.cargoBowl.attach(scene);
    this.cargoArm.attach(scene);
    this.hatch.attach(scene);
  };

  update = () => {
    this.elevator.update();
    this.cargoBowl.update();
    this.cargoArm.update();
    this.hatch.update();
  };
}
camera.position.z = 50;
camera.position.y = 25;
camera.position.x = -15;

var helper = new THREE.AxesHelper();
helper.position.set(-20, 30, 0);
scene.add(helper);

var robot = new Robot();
robot.attach(scene);

function animate() {
  requestAnimationFrame(animate);
  robot.update();
  renderer.render(scene, camera);
}
animate();
console.log("3JS STUFF DONE");
