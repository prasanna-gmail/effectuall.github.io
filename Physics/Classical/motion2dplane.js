import * as THREE from '../../build/three.module.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../../jsm/renderers/CSS2DRenderer.js';
import { GUI } from '../../jsm/libs/lil-gui.module.min.js';

let camera, scene, renderer, labelRenderer;
let controls, clock;
let inclinedPlane, slidingBox, pivotPoint, group, plane, box, line, square, point, boxNormal, boxWeight, boxForce, boxVelocity;
let arrowLine, arrowHead, elevation, road, slidePoint;
let normallabel, weightlabel, forcelabel, elevationLabel, velocitylabel;
let root;
let speedCurrent, changeF = false, retardingF = true;
let requestSpeed, stopPos;

let sceneDisplay = ['Straight', 'Inclined', 'Vertical', 'Two Force'];

const RED = 0xff0000;
const GREEN = 0x00ff00;
const BLUE = 0x0000ff;
const YELLOW = 0xffff00;

const params = {

    forces: true,
    labels: true,
    speed: 0,
    Fvalue: 0,
    acc: 0,
    reset: function() {
        console.log('reset');
        resetBox();
    },
    weight: 20,
    calculate: function() {
        console.log('calculate');
        calculate()
    },
    planeHeight:0,
    degrees: 0
    
};
const speed = new THREE.Vector3();
const force = new THREE.Vector3();

const vector = new THREE.Vector3();
let calculateEl = document.getElementById('calculate-el');
let sceneEl = document.getElementById('scene-el');

speedCurrent = speed.x;
sceneEl.addEventListener('click', function ()	{
    let A= Math.floor(Math.random()*4)
    console.log(A);
    sceneEl.innerText = sceneDisplay[A];
});	
function guiControls() {
    const gui = new GUI();
    gui.add( params, 'forces' );
    gui.add( params, 'labels' );
    gui.add(params, 'speed', [ 0, 5, 10, 15]).name('xSpeed').listen()
    .onChange((value) => {
        speed.x = Number(value/1000);
        speedCurrent = speed.x;
        forceLabelControls()
    });
    gui.add(params, 'Fvalue', [25, 5, 0, -5, -25, -50]).name('xForce').listen()
    .onChange((value) => {
        force.x= Number(value/200000);
       
        forceLabelControls()
        if (value > 0) {
            changeF = true;
            retardingF = false;
            console.log(changeF,speed.x, speedCurrent, 'accelerating force');
            forceLabelControls()
        } else if (value < 0) {
            changeF = true;
            retardingF = true;
            console.log(changeF,speed.x, speedCurrent,'retaring force');
            forceLabelControls()
        } 
        else if (value === 0) {
            changeF = false;
            speed.x = speedCurrent;
            console.log(changeF,speed.x, speedCurrent);
            // requestAnimationFrame(animate);
            forceLabelControls()
        }
        
        
    });
    gui.add(params, 'acc').name('Acceleration (m/s<sup>2</sup>)').listen()
    
    const boxGui= gui.addFolder('BOX');
    boxGui.add( params, 'weight').min(5).max(100).step(10).name('MASS (kg)')
    .onChange((value) => {
        let a = (value/100)+0.75;
        // slidePoint.position.set(0, 0, a/2);
        slidePoint.scale.set(a, a, a)
        
    });   
    boxGui.add( slidePoint.position,'x').min(-20).max(20).step(.1).name('DISTANCE (m)').listen()
    const planeGui= gui.addFolder('PLANE ELEVATION & INCLINATION');
    planeGui.add(params,'planeHeight').min(0).max(200).step(10).name('ELEVATION (m)')
        .onChange((value) => {
            // console.log(elevation);
            scene.remove(elevation);
            scene.remove(square);
            let a = (value/100);
            elevation = placeArrows(a)
            elevation.rotation.x=-1.57;
            elevation.position.x = 2;
            square = squareFromPoints(0.01+a);
            pivotPoint.position.y = a;
            scene.add(elevation);
            scene.add(square);    
        }); 
    
    planeGui.add(params, 'degrees').min(0).max(60).step(15).name('SLOPE (&#952)')
        .onChange(() => {
            pivotPoint.rotation.z = THREE.MathUtils.degToRad(-params.degrees);
            boxWeight.rotation.y = 3.14 + THREE.MathUtils.degToRad(-params.degrees);
        });
    // let degrees = {
    //     x: 0,
    //     y: 0,
    //     z: 0
    // };
     
    // planeGui.add(degrees, "z").min(0).max(60).step(15).name('SLOPE (&#952)')
    //     .onChange(() => {
    //         pivotPoint.rotation.z = THREE.MathUtils.degToRad(-degrees.z);
    //         boxWeight.rotation.y = 3.14 + THREE.MathUtils.degToRad(-degrees.z);
    //     });

    gui.add( params, 'reset');
    gui.add(params, 'calculate')
    
}

function resetBox() {
    boxForce.visible = false;
    boxVelocity.visible = false; 
    slidePoint.position.x = -1.5;
    params.speed = 0;
    params.Fvalue = 0;
    pivotPoint.rotation.z = THREE.MathUtils.degToRad(0);
    speed.x = 0;
    force.x = 0;
    params.degrees= new THREE.Vector3();
    camera.position.set( 7.5, 6.5, 11.5 ) ;
    render();
    calculateEl.textContent = "Use controls to move the box"
    console.log('reset and load initial scene -1.5');
  };
  
function calculate() {
    calculateEl.textContent  = 'Time taken to bring the body to stop = ' + (-speedCurrent*1000)/params.acc  +' sec' ;

    console.log('DISPLAY FORMULA', speedCurrent)
}

function init() {

    let container;
    container = document.getElementById('container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set( 7.5, 6.5, 11.5 ) ;
    scene.add(camera);

    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(- 1, - 1, 1);
    scene.add(light2);

    root = new THREE.Group();
    root.position.x =0;
    scene.add(root);

    //
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    //

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 500;

    //Grid
    scene.add(new THREE.GridHelper(10, 10));

    //

    loadModelBox();
    // createMenu();
    

    //

    window.addEventListener('resize', onWindowResize);

}

function initScene() {
    // create ground
    scene.add(initPlane({
        planeGeometry: new THREE.PlaneGeometry(20, 20, 1, 1),
        planeMaterial: new THREE.MeshBasicMaterial({
            color: 0x4F7942, side: THREE.DoubleSide
        }),
        xRotation: -0.5 * Math.PI,
        x: 0,
        y: -0.03,
        z: 0
      }));
    // create inclined plane with pivot point
    pivotPoint = initPoint({
        vertices: new Float32Array([0,0,0]),
        
        xRotation: 0,
        x: 2,
        y: 0,
        z: 0
    }); 
    scene.add(pivotPoint);
    inclinedPlane = initBox({
        boxGeometry: new THREE.BoxGeometry(14,3,0.05),
        boxMaterial: new THREE.MeshStandardMaterial({
            color: 0x696969
        }),
        xRotation: -0.5 * Math.PI,
        x: -7,
        y: 0,
        z: 0.05
    });
    pivotPoint.add(inclinedPlane);  

    //creat elevation point for the road
    const roadPoint = initPoint({
        vertices: new Float32Array([0,0,0]),
        
        xRotation: 0,
        x: 2,
        y: 0,
        z: 0
    }); 
    road = initBox({
        boxGeometry: new THREE.BoxGeometry(8,3,0.05),
        boxMaterial: new THREE.MeshStandardMaterial({
            color: 0x696969
        }),
        xRotation: -0.5 * Math.PI,
        x: 4,
        y: 0,
        z: 0.05
    });
    
    scene.add(roadPoint);  
    roadPoint.add(road);
    
    roadPoint.scale.y = 1;  
    inclinedPlane.add(slidePoint); 
    
    
    render();
}

function loadModelBox() {

    //create moving/sliding Box
    slidePoint = initPoint({
        vertices: new Float32Array([0,0,0]),
        
        xRotation: 0,
        x: -1.5,
        y: 0,
        z: 0
    }); 
    
    slidePoint.scale.set(0.75,0.75,0.75);
    slidingBox = initBox({
      boxGeometry: new THREE.BoxGeometry(1,1,1),
      boxMaterial: new THREE.MeshStandardMaterial({
          color: 0xff3333
      }),
      xRotation: 0,
      x: 0,
      y: 0,
      z: 0.5
  });
 
  forceIndicators(1.8);
  slidePoint.add(slidingBox);  
}


function forceIndicators(data) {
      //force indicators
      group = new THREE.Group(); 

      boxNormal = placeArrows(data, RED);
      const normaltext = document.createElement('div');
      normaltext.className = 'label';
      normaltext.textContent = 'Normal Force' ;
  
      normallabel = new CSS2DObject(normaltext);
      normallabel.position.z = data + .2;
      boxNormal.add(normallabel);
      group.add(boxNormal);
     
      boxWeight = placeArrows(data, BLUE );
      boxWeight.rotation.y = 3.14 ;
      const weighttext = document.createElement('div');
      weighttext.className = 'label';
      weighttext.textContent = 'Weight Force' ;
  
      weightlabel = new CSS2DObject(weighttext);
      weightlabel.position.z = 1 ;
      boxWeight.add(weightlabel);
      group.add(boxWeight);

      boxVelocity = placeArrows(data, YELLOW);
      boxVelocity.rotation.y = 1.57;
      const velocitytext = document.createElement('div');
      velocitytext.className = 'label';
      velocitytext.textContent = 'Velocity' ;
  
      velocitylabel = new CSS2DObject(velocitytext);
      velocitylabel.position.z = data ;
      velocitylabel.position.x = -0.5 ;    
      boxVelocity.add(velocitylabel);
      group.add(boxVelocity);

      boxForce = placeArrows(data, GREEN);
      boxForce.rotation.y = -1.57;
      const forcetext = document.createElement('div');
      forcetext.className = 'label';
      forcetext.textContent = 'Applied Force' ;
  
      forcelabel = new CSS2DObject(forcetext);
      forcelabel.position.z = data ;
      forcelabel.position.x = -0.5 ;    
      boxForce.add(forcelabel);
      group.add(boxForce);

      slidingBox.add(group);
      forcelabel.visible = false;
      boxForce.visible = false;
      velocitylabel.visible = false;
      boxVelocity.visible = false;
      render();
}

function placeArrows(value, colorValue) {
    //arrowPoint
   console.log(value, colorValue);
   
    //arrowLine    
    arrowLine = initLine({
        points: [ new THREE.Vector3( 0, 0, value ), new THREE.Vector3( 0, 0, 0)],
        lineMaterial: new THREE.LineBasicMaterial({ color: colorValue }),
        yRotation: 0,
        x: 0,
        y: 0,
        z: 0
    }); 

    // arrowHead   
    arrowHead = initLine({
        points: [new THREE.Vector3( 0.2, 0, value-0.2),  new THREE.Vector3( 0, 0, value), new THREE.Vector3( -0.2, 0, value-0.2) ],
        lineMaterial: new THREE.LineBasicMaterial({ color: colorValue }),
        yRotation: 0,
        x: 0,
        y: 0,
        z: 0
    }); 
    // grouping
    
   
    arrowLine.add(arrowHead);
   
    return arrowLine
}

function initBox(data) {
    box = new THREE.Mesh(data.boxGeometry, data.boxMaterial);
    box.rotation.x = data.xRotation;
    box.position.x = data.x;
    box.position.y = data.y;
    box.position.z = data.z;
    return box;
}

function initPlane(data) {
    plane = new THREE.Mesh(data.planeGeometry, data.planeMaterial);
    plane.rotation.x = data.xRotation;
    plane.position.x = data.x;
    plane.position.y = data.y;
    plane.position.z = data.z;
    return plane;
}

function initLine(data) {
    let lineGeometry = new THREE.BufferGeometry().setFromPoints( data.points );    
    line = new THREE.Line( lineGeometry, data.lineMaterial );
    
    line.rotation.y = data.yRotation;
    line.position.x = data.x;
    line.position.y = data.y;
    line.position.z = data.z;
    return line;
}

function squareFromPoints(a) {
    let squareGeometry = new THREE.BufferGeometry()
    const vertices = new Float32Array( [
        0,  0, 1.6,
         0, 0, -1.4,
        0,  a,  -1.4,
    
         0,  a, -1.4,
        0,  a,  1.6,
        0,  0, 1.6
    ] );
    squareGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );  
    let squareMaterial = new THREE.MeshBasicMaterial( { color: 0x999000, side: THREE.DoubleSide } );  
    square = new THREE.Mesh( squareGeometry, squareMaterial );
    
    
    
    square.position.x = 2;
    // square.position.y = data.y;
    // square.position.z = data.z;
    return square;
}

function initPoint(data) {
    let pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(data.vertices, 3));
    let pointMaterial = new THREE.PointsMaterial( { color: 0x888888, size: 0.01 } );
    point = new THREE.Points(pointGeometry, pointMaterial);
    
    point.rotation.x = data.xRotation;
    point.position.x = data.x;
    point.position.y = data.y;
    point.position.z = data.z;
    return point;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

function forceLabelControls() {
    
    if (retardingF) {
        boxForce.rotation.y = -1.57;
        boxForce.position.z = 0;
    } else if (!retardingF) {
        boxForce.rotation.y = 1.57;
        boxForce.position.z = .4;
    }
    if ( speed.x > 0 && !changeF ) {
        boxVelocity.visible= true;
        velocitylabel.visible= true;
        requestSpeed = requestAnimationFrame(forceLabelControls);
        slidePoint.position.add(speed);    
    } else if (speed.x >= 0 && changeF) {
        boxVelocity.visible= true;
        velocitylabel.visible= true;
        boxForce.visible= true;
        forcelabel.visible= true;
        requestSpeed = requestAnimationFrame(forceLabelControls);
        slidePoint.position.add(speed.add(force)); 
    } else if (speed.x <= 0) {
        boxVelocity.visible= false;
        velocitylabel.visible= false;
        boxForce.visible= false;
        forcelabel.visible= false;
        cancelAnimationFrame( requestSpeed);
    }     
    
}

function animate() {
    controls.update();
    render();
    requestAnimationFrame(animate);
    params.acc = (force.x*200000)/ params.weight;

    if ( params.forces  ) {
        boxWeight.visible= true;
        weightlabel.visible= false;
        boxNormal.visible= true;
        normallabel.visible= false;
        forcelabel.visible= false;
        velocitylabel.visible= false;
    } 
    if ( !params.forces  ) {
        boxWeight.visible= false;
        weightlabel.visible= false;
        boxNormal.visible= false;
        normallabel.visible= false;
        forcelabel.visible= false;
        velocitylabel.visible= false;
    } 
    if ( params.forces && params.labels  ) {
        weightlabel.visible= true;
        normallabel.visible= true;
    }
}

function render() {

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

}

window.onload = function() {
    init();
    animate();
    initScene();

    guiControls();
   
    scene.add(new THREE.AmbientLight(0xffffff));
    
    
}
