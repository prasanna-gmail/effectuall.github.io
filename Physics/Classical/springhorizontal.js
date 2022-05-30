import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../../jsm/renderers/CSS2DRenderer.js';
import  Stats  from '../../jsm/libs/stats.module.js';
import { GUI } from '../../jsm/libs/lil-gui.module.min.js';
let scene, camera, mainLight, renderer, labelRenderer, stats, controls, clock;
let width = window.innerWidth, height =window.innerHeight;
let mass, rod, weight, hook, wall, xDist, refLine,  distGeometry, distText, eqbmPoint;
let model, forceHand, arrowForce, arrowSpring, forceLabel, springLabel, distLabel, distValue;
let y = 0, dy = 0.0005, K = 0;
let x = 0, initPos=0;
let params ={
    kConst: 100,
    m: 0,
    force: 0,
    b: 0.11,
    points: 400,
    extrude: 0.05,
    r: 2,
    t: 120,
    reset: false,
    restore: function() {
      resetSpring();
    },
    harmonic: false,
    horizontal: false,
    grid: false
}
const M = [0,5,10,15,25,50,100]
let grid = new THREE.Group();
let point = new THREE.Group();
let distMeasure = new THREE.Group();
let spring = new THREE.Group();
let group = new THREE.Group();
let tubeGeometry, material, mesh;
let messageEl = document.getElementById('message-el');
let topMenu = document.getElementById('topmenu');
function createCamera() {
    // Create a Camera
    const fov = 50; // AKA Field of View
    const aspect = width / height;
    const near = 0.1; // the near clipping plane
    const far = 1000; // the far clipping plane

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-28, -6, -30);

} 
function createLights() {
    // Create a directional light
    const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 4);
    mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
    scene.add(ambientLight);

    // move the light back and up a bit
    mainLight.position.set(10, 10, 10);

    // remember to add the light to the scene
    scene.add(ambientLight, mainLight);
}
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('skyblue');
    stats = new Stats();
    clock = new THREE.Clock();
    createCamera();
    createLights();
    createRenderer();
     //Grid
    grid = new THREE.GridHelper(50, 50);
    grid.position.set( 0, -2.5, 0 );
    grid.rotation.z = 1.57;
    scene.add(grid);
    grid.visible = false;
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;  
    controls.target.set(0, -2, 6);

    let pointGeometry = new THREE.BufferGeometry().setAttribute('position', 
                        new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
    let pointMaterial = new THREE.PointsMaterial( { color: 0x888888, size: 0.01 } );
    point = new THREE.Points(pointGeometry, pointMaterial);
    point.rotation.x = 1.57;
    point.position.y = 11;
    let boxGeometry = new THREE.BoxGeometry( 15, 15, 1 );
    let boxMaterial = new THREE.MeshStandardMaterial({
        color: "rgb(10%, 15%, 5%)"
    });
    wall = new THREE.Mesh(boxGeometry, boxMaterial);  
    wall.position.z=-2.5


hook = initTube({
  radius: 2.2,
  width: 2,
  xRotation: 1.57,
  col: "rgb(10%, 15%, 5%)",
  x: 0,
  y: 0,
  z: -1
});

mass = initTube({
  radius: 2.2,
  width: 1,
  xRotation: 1.57,
  col: "rgb(5%, 15%, 15%)",
  x: 0,
  y: 0,
  z: 0.5
});
rod = initTube({
  radius: .2,
  width: 5,
  xRotation: 0,
  col: "rgb(5%, 15%, 15%)",
  x: 0,
  y: 3,
  z: 0
});
weight = initTube({
  radius: 2.2,
  width: .5,
  xRotation: 0,
  col: "rgb(5%, 15%, 15%)",
  x: 0,
  y: 2.5,
  z: 0
});
    addSpring( params.extrude, params.b, params.t, params.points); 
    point.add(hook,wall);
    point.add(spring, mass);
    mass.add(rod);
    rod.add(weight);
    mass.add( group );
    // group.rotation.x = 1.57;
    group.position.z = -2.5;
        // wall.add( hook, eqbmPoint );
    
    
    messageEl.innerText = 'Spring Const, k =' +  params.kConst + ' N/m';   
    initPos = mass.position.z;
    // group.add(distLabel);
    // distLabel.position.z = 8;
    scene.add( point);
    window.addEventListener('resize', onWindowResize);
    
}


window.onload = function() {
    init();
    controls.update()
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
    animate();
    guiControls();
    createModel ();
    visualAides();
   
    // scene.add(new THREE.AmbientLight(0xffffff));  
}


function guiControls() {
    // dat.GUI
  
    const gui = new GUI( { width: 250 } );
   // camera control adjust
    // let controlFolder = gui.addFolder("Control");
    // controlFolder.add(controls.target, 'x', -100, 100);
    // controlFolder.add(controls.target, 'y', -100, 100);
    // controlFolder.add(controls.target, 'z', -100, 100);
    // let cameraFolder = gui.addFolder("Camera");
    // cameraFolder.add(camera.position, 'x', -100, 100);
    // cameraFolder.add(camera.position, 'y', -100, 100);
    // cameraFolder.add(camera.position, 'z', -100, 100);
    const folderSpring = gui.addFolder( 'Spring Constant' );
   
    folderSpring.add( params, 'kConst',100, 1000, 10 ).name('k (N/m)').onChange((value) => { 
      params.extrude = value/2000;
      params.t = 125 - value/20;
      params.points = 410- Math.round(value/10); 
      params.b = 0.1 + value/10000;
      mass.scale.x = value>500? 1.15 : 1;
      mass.scale.y = value>500? 1.15 : 1;
      mass.scale.z = value>500? 1.15 : 1
      params.force = 0;
      params.m = 0;
      weight.scale.y = 1 ;
      params.harmonic = false;
      refLine.position.z= (params.b*params.t);
    //   console.log(params.extrude, params.b, params.t, params.points)
      addSpring( params.extrude, params.b, params.t, params.points);
      messageEl.innerText = 'Spring Const, k =' + value + ' N/m';
        scaleVectors((params.force));
        showLabel(forceLabel);
        showLabel(springLabel);
        distChange(0);
      guiControls();
      initPos = mass.position.z;
    });
    const folderGeometry = gui.addFolder( 'Geometry' );
    folderGeometry.add( params, 'force', -100, 100, 10 ).name('Apply Force (N)').onChange((value) => { 
      params.force = value;
      y = 0;
      K = (params.force)/(1200+params.kConst) ;
     
      showLabel(forceLabel);
      showLabel(springLabel);
      boxAction();
    });
    folderGeometry.add( params, 'm', M ).name('Add weights (Kg)').onChange((value) => { 
      params.force = value;
      y = 0;
      
      K = (params.force)/(1200+params.kConst) ;
      if (params.harmonic && !params.horizontal) {
        weight.scale.y = 1 + value/10;
        showLabel(forceLabel);
        showLabel(springLabel);
        boxAction();
    } else if (!params.horizontal) {
        weight.scale.y = 1 + value/10;
        showLabel(forceLabel);
        showLabel(springLabel);
        weightAction();
    }
     
    });
    folderGeometry.add( params, 'harmonic' ).name('S.H.M').onChange((value) => {
      boxAction();  
        
      });
    folderGeometry.add( params, 'restore' ).name('Reset');
    folderGeometry.add( params, 'grid' ).name('Grid').onChange(() => {
      gridDisplay();
  });
    folderGeometry.add( params, 'horizontal' ).name('Spring in Horizontal Position').onChange(() => {
        if (params.horizontal) {
            point.rotation.x = 0;
            point.position.y = 0;
            // group.rotation. x = -1.57;
            camera.position.set(-26, 2.5, 10);
            forceHand.visible = true;
        } else {
            point.rotation.x = 1.57;
            point.position.y = 11; 
            // group.rotation.x = 1.57;
            camera.position.set(-28, -6, -30);
            group.position.z = -2.5;
            forceHand.visible = false;
        }
        // 
        resetSpring()
      });
   
}

function createRenderer() {
    // create the renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.alpha = true;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild( renderer.domElement );

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
}

function render() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    // labelRenderer.setSize(window.innerWidth, window.innerHeight);
    render();

}

function animate() {   
    requestAnimationFrame( animate );
    
    controls.update();

    stats.update();
    
	render();
}

function initTube(data) {
    let tubeGeometry = new THREE.CylinderGeometry( data.radius, data.radius, data.width, 16 );
    let tubeMaterial = new THREE.MeshStandardMaterial({
        color: data.col
    });
  
    // boxMaterial.color.convertSRGBToLinear();
    let tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.rotation.x = data.xRotation;
    tube.position.x = data.x;
    tube.position.y = data.y;
    tube.position.z = data.z;
  
    return tube;
}

function addSpring(extrude, b, t, data) {
    // xDist = params.extrude*params.b;
    xDist = b;
    mass.position.z = t*xDist ; 
  if ( mesh !== undefined ) {

    spring.remove( mesh );
    mesh.geometry.dispose();

  }

  const helixPoints = helixPointsArray( params.r, xDist, t);
  const curve = new THREE.CatmullRomCurve3( helixPoints );

  tubeGeometry = new THREE.TubeBufferGeometry( curve, data, extrude, 8, false );
  material = new THREE.MeshPhongMaterial({
    color: 0xff3333,
    flatShading: false,
    side: THREE.DoubleSide
  })
  material.color.convertSRGBToLinear();
  
  addGeometry( tubeGeometry, material);
  

}

function helixPointsArray( a, b, value ) {

    const curvePoints = [];
  
    for ( let t = 0; t <value; t += 0.1 ) {
  
      curvePoints.push( helixPoint( a, b, t ) );
  
    }
  
    return curvePoints;
  
}
  
function helixPoint( a, b, t ) {
  
    return new THREE.Vector3( a * Math.cos( t ), a * Math.sin( t ), b * t );
  
}

function addGeometry( geometry, mat ) {
    // console.log(spring)
    mesh = new THREE.Mesh( geometry, mat);

    spring.add( mesh );
}

function createModel () {
    const loader = new GLTFLoader();
    loader
    .setPath('../model/')
    .load('forceHand.glb', function(gltf) {
        model = gltf.scene; 
        forceHand = model.getObjectByName( 'forceHand' ); 
        arrowForce = model.getObjectByName( 'arrowForce' ); 
        forceHand.position.set(0,2.7,2);
        forceHand.rotation.z= 1.57;
        forceHand.rotation.y= 1.57;
        forceHand.scale.set(3,3,3)
        arrowSpring = arrowForce.clone();
        arrowSpring.material = new THREE.MeshPhongMaterial({color: 0xFF0000, side: THREE.DoubleSide});
        eqbmPoint = arrowForce.clone();
        eqbmPoint.material = new THREE.MeshPhongMaterial({color: 0xFF008c, side: THREE.DoubleSide});
        refLine.add(eqbmPoint);
        eqbmPoint.rotation.y= 1.57;
        eqbmPoint.rotation.z= 1.57;
        eqbmPoint.scale.set(2,2,2)
        scaleVectors(params.force)
        arrowForce.rotation.x = 1.57;
        arrowSpring.rotation.x = 1.57;
        arrowForce.position.z = -2;
        arrowSpring.position.z = -2;
        forceLabel = addLabels('Applied F', "#0000ff").label;
        forceLabel.position.y = -1.5;
        arrowForce.add(forceLabel );
        
        springLabel = addLabels('Spring F', "#ff0000").label;
        springLabel.position.y = -1;
        arrowSpring.add(springLabel);
        group.add(arrowForce, arrowSpring, forceHand);
        // scene.add(forceHand);
        forceHand.visible = false;
        forceLabel.visible = false;
        springLabel.visible = false;
        // Label.add(forceText, springText, cloneForce, cloneSpring);
    });
}

function resetSpring() {
    
    params.reset = true;
    params.kConst = 100;
    params.force = 0;
    params.m = 0;
    params.extrude = 0.05;
    params.b = 0.11;
    params.t = 120;
    params.points = 400;
    params.harmonic = false;
    dy = 0.0005;
    y = 0;
    K= 0;
    addSpring( params.extrude, params.b, params.t, params.points); 
    weight.scale.y = 1;
    refLine.position.z= (params.b*params.t);
    scaleVectors(params.force);
    guiControls();
    messageEl.innerText = 'Spring Const, k =' +  params.kConst + ' N/m';
    forceLabel.visible = false;
    springLabel.visible = false;
    initPos = mass.position.z;
    topMenu.innerText ='SPRING FORCE'  
    distChange(0)
}

function scaleVectors(value) {
    arrowForce.scale.z = value;
    arrowSpring.scale.z = -value;
   
}

function forceAction() {
    // console.log(mass.position.z, initPos);
   
    if (K > 0 && y < Math.abs(K) ) {
      y +=dy
      mass.position.z += y; 
      addSpring( params.extrude, params.b + y, params.t, params.points );
      scaleVectors((params.force/30));
      distChange(mass.position.z -  initPos);
      
      requestAnimationFrame( forceAction);
      
    } else if ( K < 0 && Math.abs(y) < Math.abs(K) ) {
      y +=-dy
      mass.position.z -= y; 
      addSpring( params.extrude, params.b + y, params.t, params.points );
      scaleVectors((params.force/30));
      distChange(mass.position.z - initPos);
      
      requestAnimationFrame( forceAction);
      
    } else {
      
      cancelAnimationFrame(forceAction)
    }
    
}

function weightAction() {
  if (K > 0 && y < Math.abs(K) ) {
    y +=dy
    mass.position.z += y; 
    addSpring( params.extrude, params.b + y, params.t, params.points );
    scaleVectors((params.force/30));
    distChange(mass.position.z -  initPos);
        
    requestAnimationFrame( weightAction );
  } else {
    cancelAnimationFrame( weightAction )
  }
 
}
function boxAction() {
//  console.log( point.position, eqbmPoint.position, group.position );
if (!params.harmonic && params.horizontal) {
    topMenu.innerText ='SPRING FORCE';  
    forceHand.visible = true;
    forceAction();
  } else if (!params.harmonic && !params.horizontal) {
    
    mass.position.z += K; 
    addSpring( params.extrude, params.b +K, params.t, params.points );
    scaleVectors((params.force/30));
    distChange(mass.position.z -  initPos);
    topMenu.innerText ='SPRING FORCE';    
    requestAnimationFrame( weightAction );
    // cancelAnimationFrame(boxAction)
    
  } else if (params.force!=0 || params.m !=0) {    
    // let a = (params.force/params.kConst);
    let a = (params.force)/(1200+params.kConst) ;    
    addSpring(params.extrude, params.b + a*Math.sin(x),  params.t, params.points );
    scaleVectors((params.force/30)*Math.sin(x));
    distChange(-(initPos - (params.b +  a*Math.sin(x))*params.t) )
    x += .01;
    topMenu.innerText = 'SIMPLE HARMONIC MOTION OF A SPRING';
    forceHand.visible =false;  
    requestAnimationFrame( boxAction);
    render()
  }  
 
}


function addLabels(name, col) {
   
    let text= document.createElement('div');
    text.className = 'label';
    text.textContent =  name;
    text.style.color = col;
    
    let label= new CSS2DObject(text);
    label.position.z = -2;      
    label.position.y = 1;
    
    return {label, text}
}

function showLabel(label) {
    if (params.force != 0) {

        label.visible = true;

    } else{

        label.visible = false;

    }
}

function visualAides() {
    let reflineGeometry = new THREE.BufferGeometry().setFromPoints( 
        [ new THREE.Vector3( -10, 0, 0),
          new THREE.Vector3( 10, 0, 0)]);
    refLine = new THREE.Line(reflineGeometry, 
            new THREE.LineBasicMaterial({ color: 0xFF008C, side: THREE.DoubleSide }));
            
    point.add( refLine);
    refLine.position.z= (params.b*params.t);
    refLine.rotation.z = 1.57;
    distGeometry = new THREE.BufferGeometry().setFromPoints( 
        [ new THREE.Vector3( -3.5, 0, 0),
          new THREE.Vector3( -3.5, 0, 0)]);
    distMeasure = new THREE.Line(distGeometry, 
                    new THREE.LineBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }));
    refLine.add(distMeasure);
    distText = document.createElement('div');
    distText.className = 'label';
    distText.textContent = 'd = '+0;

    distValue = new CSS2DObject(distText);
    distValue.position.set(-8.5, 0, 1);
    distMeasure.add(distValue);
    
}

function distChange(xvalue) {
    // console.log(xvalue)
    distMeasure.geometry.dispose();
    let newdistGeometry = new THREE.BufferGeometry().setFromPoints( 
      [ new THREE.Vector3( -3.5, 0, xvalue),
        new THREE.Vector3( -3.5, 0, 0)]);
    distMeasure.geometry = newdistGeometry ;
    distText.innerHTML ='d = '+ xvalue.toFixed(2) ;
}

function gridDisplay() {
  if (params.grid) {
      
      grid.visible = true;
  } else {
      
      grid.visible = false;
  }
  
}