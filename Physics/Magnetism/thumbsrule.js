import * as THREE from '../../build/three.module.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import  Stats  from '../../jsm/libs/stats.module.js';


let model, mixer, camera, controls;
let loop = false;
let flow = 1;
let coilflow = 1;
let hand, wire, coil, mfwire, arrow, arrow1, mfcoil, mfview;
const modelPath = '../model/';
const RULES = {
  'Rule': 'thumbsrule.glb'
};
let actions= [];
let message = "";
let messageEl = document.getElementById("message-el");
let ruleEl = document.getElementById("rule-el");
let close = document.getElementById("close");

//scene
const container = document.getElementById( "container" );
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);

//camera
camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.001, 1000 );
camera.position.set( 0, 3, 3 );
//camera.rotation.set(-26, 0, 0);
const stats = new Stats();
const clock = new THREE.Clock();
container.appendChild( stats.dom );
//renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
//container.appendChild( renderer.domElement );
container.appendChild( renderer.domElement );

//cameracontrols
controls = new OrbitControls( camera, renderer.domElement );
controls.enablePan = true;
controls.enableZoom = true;
controls.target.set( 0, 0, 0 );
controls.update();

//create light 
let hemiLight = new THREE.AmbientLight( 0xffffff, .20 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

let dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
dirLight.position.set( -30, 50, -30 );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 70;
dirLight.shadow.camera.bottom = -70;
dirLight.shadow.camera.left = -70
dirLight.shadow.camera.right = 70;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add( dirLight );

const buttonconductorEl = document.getElementById( 'conductor-el' );
const buttoncoilEl = document.getElementById( 'coil-el' );
const buttoncurrentEl = document.getElementById( 'current-el' );
const buttonhandEl = document.getElementById( 'hand-el' );
const buttonmflinesEl = document.getElementById( 'mflines-el' );

//load rule1
//rule1Model();
//currentFlow( );        

const loader = new GLTFLoader();
loader
  .setPath(modelPath)
  .load(RULES['Rule'], function (gltf) {
    model = gltf.scene;
    hand = model.getObjectByName('Armature');
    wire = model.getObjectByName('wire');
    coil = model.getObjectByName('coil');
    arrow = model.getObjectByName('arrow');
    mfwire = model.getObjectByName('MFwire');
    arrow1 = model.getObjectByName('arrow1');
    mfcoil = model.getObjectByName('MFcoil');
    mfview = model.getObjectByName('MFview');
    
    //model.position.set(2, 2, 0);
    gltf.scene.traverse((child) => {
      if ( child.type == 'SkinnedMesh' ) {
        child.frustumCulled = false;
      }
    });
    scene.add(wire);
    mixer = new THREE.AnimationMixer(model);
    let loopAnim = ['straight', 
                    'direction', 
                    'loop',
                    'loopAnti', 
                    'loopClock', 
                    'anticoilthumb' ];

    let ruleAnim = ['ThumbRule', 
                    'handReverse', 
                    'wireloop' ];

    renderer.render(scene, camera);

    for (let i = 0; i < gltf.animations.length; i++) {

      let clip = gltf.animations[i];
      let action = mixer.clipAction(clip);
      actions[clip.name] = action;

      if (ruleAnim.indexOf(clip.name) >= 0) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
    }
    scene.add(arrow);
    
    actions['straight'].setDuration(1).play();
    animate();
    buttonconductorEl.addEventListener( 'click', function () {
      actions['loopClock'].stop();
      actions['wireloop'].stop();
      actions['handReverse'].stop().reset();
      actions['ThumbRule'].stop().reset();
      actions['loop'].stop();
      actions['anticoilthumb'].stop();
      actions['direction'].stop();
      actions['straight'].stop();
      actions['loopAnti'].stop();
      camera.position.set( 0, 3, 3 );
      camera.rotation.set( 0, 0, 0 );
      controls.target.set( 0, 0, 0 );
      conductorModel( );
      
    } );

    buttoncoilEl.addEventListener( 'click', function () {
      actions['loopClock'].stop();
      actions['wireloop'].stop();
      actions['handReverse'].stop();
      actions['ThumbRule'].stop();
      actions['loop'].stop();
      actions['anticoilthumb'].stop();
      actions['direction'].stop();
      actions['straight'].stop();
      actions['loopAnti'].stop();
      camera.position.set( .5, .75, 2.5 );
      controls.target.set( .5, 0, 0.2 );
      
      conductorModel( );
      
    } );

    buttoncurrentEl.addEventListener( 'click', function () {
      actions['loopClock'].stop();
      //actions['wireloop'].stop();
      actions['handReverse'].stop();
      actions['ThumbRule'].stop();
      actions['loop'].stop();
      actions['anticoilthumb'].stop();
      actions['direction'].stop();
      actions['straight'].stop();
      actions['loopAnti'].stop();
      //actions['mfdirectionSwitch'].stop();
      
      currentFlow( )
    } );
            
    buttonhandEl.addEventListener( 'click', function () {
      actions['handReverse'].stop().reset();
      actions['ThumbRule'].stop().reset();
      actions['loop'].stop().reset();
      actions['anticoilthumb'].stop().reset();
      
      //actions['mfdirectionSwitch'].stop();
      
      handModel( );
     
    } );
    
    buttonmflinesEl.addEventListener( 'click', function () {
      ruleEl.style.visibility = "visible";
      mflinesModel( );
      
    } );
    close.addEventListener('click', function() {
      ruleEl.style.visibility = "hidden";
    })
    
  window.addEventListener("resize", onWindowResize);

});

function conductorModel( ){
  if (loop === false) {
    scene.remove(wire);
    scene.remove(hand);
    scene.remove(arrow);
    scene.remove(mfwire);
    scene.remove(mfview);
    scene.remove(mfcoil);
    scene.add(coil);

    buttonconductorEl.style.backgroundColor = "rgb(3, 108, 156)";
    buttoncoilEl.style.backgroundColor = "rgb(3, 67, 97)";
    //actions['wireloop'].reset();
    actions['wireloop'].setDuration(1).play();
    setTimeout(function () {
      if (coilflow === 1) {
        scene.add(arrow1);
        
        //actions['loopAnti'].reset();
        actions['loopClock'].setDuration(1).play();
        //actions['straight'].setDuration(1).play();
        coilflow = -1;

        message = " Current direction in the loop CLOCKWISE";
        messageEl.textContent = message;
        animate();
      } else if (coilflow === -1) {
        scene.add(arrow1);
        
        //actions['loopClock'].reset();
        actions['loopAnti'].setDuration(1).play();

        coilflow = 1;
        message = "Current direction in the loop COUNTER-CLOCKWISE";
        messageEl.textContent = message;
        animate();
      }
    }, 1000);
    loop = true;
  } else if (loop === true) {
    scene.remove(coil);
    scene.remove(hand);
    scene.remove(arrow1);
    scene.remove(mfwire);
    scene.remove(mfview);
    scene.remove(mfcoil);
    scene.add(wire);
    scene.add(arrow);
    buttonconductorEl.style.backgroundColor = "rgb(3, 67, 97)";
    buttoncoilEl.style.backgroundColor = "rgb(3, 108, 156)";
    
    //actions['direction'].reset();
    actions['straight'].setDuration(1).play();
    loop = false;
    flow = 1;
    message = "Current direction in the conductor UP";
    messageEl.textContent = message ;
    animate();
  }
  
 
}


function currentFlow( ) {
  if (loop === false && flow === 1) {
    scene.remove(hand);
    scene.remove(mfwire);
    scene.remove(mfcoil);
    scene.remove(mfview);
    //actions['straight'].reset();
    actions['direction'].setDuration(1).play();
    //actions['straight'].setDuration(1).play();
    flow = -1;
    
    message = " Current direction in the conductor DOWN";
    messageEl.textContent = message ;
    animate();
  } else if (loop === false && flow === -1) {
    scene.remove(hand);
    scene.remove(mfwire);
    scene.remove(mfcoil);
    scene.remove(mfview);
    
    //actions['direction'].reset();
    actions['straight'].setDuration(1).play();
    
    flow = 1;
    message = "Current direction in the conductor UP";
    messageEl.textContent = message ;
    animate();
  } 
  if (loop === true && coilflow === 1) {
    scene.remove(hand);
    scene.remove(mfwire);
    scene.remove(mfcoil);
    scene.remove(mfview);
    
    //actions['loopAnti'].reset();
    actions['loopClock'].setDuration(1).play();
    //actions['straight'].setDuration(1).play();
    coilflow = -1;
    
    message = " Current direction in the loop CLOCKWISE";
    messageEl.textContent = message ;
    animate();
  } else if (loop === true && coilflow === -1) {
    scene.remove(hand);
    scene.remove(mfwire);
    scene.remove(mfcoil);
    scene.remove(mfview);
    
    //actions['loopClock'].reset();
    actions['loopAnti'].setDuration(1).play();
    
    coilflow = 1;
    message = "Current direction in the loop COUNTER-CLOCKWISE";
    messageEl.textContent = message ;
    animate();
  } 
}

function handModel( ) {
  if (loop === false && flow === 1){
    
    scene.add(hand);
    actions['ThumbRule'].play();
    
    message = "The thumb shows the current direction pointed UP and the fingers magnetic field direction around the wire ";
    messageEl.textContent = message ;
    animate();
  } else if (loop === false && flow === -1){
    scene.add(hand);
   
    actions['handReverse'].play();
    
    message = "The thumb shows the current direction pointed DOWN and the fingers magnetic field direction around the wire ";
    messageEl.textContent = message ;
    animate();
  } else if (loop === true && coilflow === 1){
       
    scene.add(hand);
    
    actions['anticoilthumb'].setDuration(10).play();
    
    message = "The thumb shows the current direction and the fingers magnetic field direction around the wire ";
    messageEl.textContent = message ;
    animate();
  } else if (loop === true && coilflow === -1){
    scene.add(hand);
    actions['loop'].setDuration(10).play();
    
    message = "The thumb shows the current direction and the fingers magnetic field direction around the wire ";
    messageEl.textContent = message ;
    animate();
  }
  
}

function mflinesModel( ) {
  if (loop === false && flow === 1){
    
    
    setTimeout(function(){
      scene.add(mfwire);
      mfwire.rotation.set( 0, 0, 0 );
      scene.add(mfview);
      mfview.rotation.set( 0, 3.14, 0 );
    }, 500); 
    
    message = "Current direction in the conductor UP; M.F lines are in ANTICLOCKWISE direction ";
    messageEl.textContent = message ;
    animate();
  } else if (loop === false && flow === -1){
    
    setTimeout(function(){
      scene.add(mfwire);
      mfwire.rotation.set( 3.14, 0, 0 );
      scene.add(mfview);
      mfview.rotation.set( 0, 0, 0 );
    }, 500); 
    
    message = "Current direction in the conductor DOWN; M.F lines are in CLOCKWISE direction ";
    messageEl.textContent = message ;
    animate();
  } else if (loop === true && coilflow === 1){
    
   
    setTimeout(function(){
      scene.add(mfcoil);
      mfcoil.rotation.set(0, 0, 0);
      setTimeout(function(){
        fieldRotation();
        
      }, 500); 
    }, 500); 
    
    message = "Current direction in the conductor ANTICLOCKWISE;  M.F lines points out of the coil at the center ";
    messageEl.textContent = message ;
    animate();
  } else if (loop === true && coilflow === -1){
   
    //actions['mfdirectionSwitch'].play();
    setTimeout(function(){
      scene.add(mfcoil);
      mfcoil.rotation.set(3.14, 0, 0);
      setTimeout(function(){
        fieldRotation();
        
      }, 500); 
    }, 500); 
    
    message = "Current direction in the conductor CLOCKWISE;  M.F lines points into the coil at the center  ";
    messageEl.textContent = message ;
    animate();
  }
  
}

function fieldRotation(){
  requestAnimationFrame( fieldRotation );
  mfcoil.rotation.z += .01;
  renderer.render( scene, camera );
}


//window resizing

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}


function animate() {
	requestAnimationFrame( animate );
    const delta = clock.getDelta();

    mixer.update(delta);

    controls.update();

    stats.update();

	renderer.render( scene, camera );
};





        