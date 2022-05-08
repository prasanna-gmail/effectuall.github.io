import * as THREE from '../../build/three.module.js'
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import  Stats  from '../../jsm/libs/stats.module.js';



let button;
let flip = 0;
let flow = 0;
let current;
let mixer;
let model, camera, controls, fov;
let actions = {};
const modelPath = '../model/';
const elements = {
  'wire': 'supply.glb'
};
let message = "";
let messageEl = document.getElementById("message-el");
//scene
const container = document.getElementById( 'container' );
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);

//camera
fov =35
camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 5, 3, 5 );

const stats = new Stats();
const clock = new THREE.Clock();
container.appendChild( stats.dom );
//renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.alpha = true;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;
//renderer.shadowMap.enabled = true;
//container.appendChild( renderer.domElement );
container.appendChild( renderer.domElement );

//cameracontrols
controls = new OrbitControls( camera, renderer.domElement );
controls.enablePan = true;
controls.enableZoom = true;
controls.target.set( 1, .8, 0 );
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

//Grid
scene.add( new THREE.GridHelper( 10, 10) );

const buttonFlip = document.getElementById( 'flip' );
const buttonFlow = document.getElementById( 'flow' );

//load a model
function createModel () {
    const loader = new GLTFLoader();
    loader
    .setPath(modelPath)
    .load(elements['wire'], function(gltf) {
        model = gltf.scene;
        scene.add(model);
        current = model.getObjectByName( 'arrow' );
        
        mixer = new THREE.AnimationMixer( model );
        
        current.morphTargetInfluences[0] = 1;
        
		let fixedStates = [ 'polarity1', 'polarity', 'needleL', 'needleR' ];
	   
        
	    for ( let i = 0; i < gltf.animations.length; i ++ ) {

		    let clip = gltf.animations[ i ];
		    let action = mixer.clipAction( clip );
		    actions[ clip.name ] = action;
            
            if (fixedStates.indexOf(clip.name) >= 0){
                action.clampWhenFinished = true;
				action.loop = THREE.LoopOnce;
                
                //console.log(i, clip.name, fixedStates.indexOf(clip.name) )
            }    
        }
        animate();
        
        buttonFlip.addEventListener( 'click', function () {
            actions['polarity1'].reset();
            actions['polarity'].reset();
            actions['flowF'].stop();
            actions['flowR'].stop();
            button = 1;
            setCamera()
            polarity( );
        } );
        
        buttonFlow.addEventListener( 'click', function () {
            actions['needleR'].stop().reset();
            actions['needleL'].stop().reset();
            actions['flowF'].stop().reset();
            actions['flowR'].stop().reset();
            
            button = 0;
            setCamera()
            currentFlow( );
        } );
    
	}, undefined, function ( e ) {

				console.error( e );

	} );
    window.addEventListener("resize", onWindowResize);
      
}

function currentFlow( ) {
    if (flip === 0 && flow === 0) {
        actions['needleR'].setDuration( 5 ).play();
        setTimeout(function(){
            current.morphTargetInfluences[0] = 0;
            actions['flowF'].setDuration( 5 ).play();
          }, 2500); 
        flow = 1;
        message = "Current Flows from A to B, Compass needle deflects";
        messageEl.textContent = message ;
        animate();
    } else if (flip === 1 && flow === 0) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            current.morphTargetInfluences[0] = 0;
            actions['flowR'].setDuration( 5 ).play();
          }, 2500); 
        flow = 1; 
        message = "Current Flows from B to A, Compass needle deflects in opposite direction";
        messageEl.textContent = message ;
        animate();
    } else  {
        actions['needleR'].fadeOut();
        actions['needleL'].fadeOut();
        current.morphTargetInfluences[0] = 1;
        flow = 0;  
        message = "No Current Flows, Switch OFF";
        messageEl.textContent = message;
        animate();      
    }
}

function polarity( ) {
    
    if (flip === 0 ) {
        actions['polarity'].fadeOut();
        actions['needleR'].fadeOut();
       
        actions['flowR'].fadeOut();
        actions['polarity1'].setDuration( 2 ).play();
        current.morphTargetInfluences[0] = 1;
        flow = 0;    
        flip = 1;
        message = "Polarity Changed. B is now the + terminal";
        messageEl.textContent = message ;
        animate();
         

    } else if (flip === 1 ) { 
        actions['polarity1'].fadeOut();
        actions['needleL'].fadeOut();
        
        actions['flowF'].fadeOut();
        actions['polarity'].setDuration( 2 ).play();
        current.morphTargetInfluences[0] = 1;
        flow = 0;    
        flip = 0;
        message = "Polarity Changed. A is now the + terminal";
        messageEl.textContent = message ;
        animate();
       

    } 
}

function setCamera() {
    
    if (button === 1) {
        fov = 40;
        camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set( 5, 3, 5);
        camera.rotation.set( 0, 0, 0 );
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set( 1, .8, 0 );
        controls.update();
        renderer.render( scene, camera );
        
    } else if (button === 0) {
        fov = 20;
        camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(5, 5, 5);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(1, 0.4, 0);
        controls.update();  
        renderer.render( scene, camera );
    }
    
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


createModel();


        