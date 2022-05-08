import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import  Stats  from '../../jsm/libs/stats.module.js';

let element = 0;
let flip = false;
let flow = false;
let slow = false;
let fDirection = false;
let mrotate = false;
let hGesture = false;
let camera, aspect, fov, stats, clock;
let scene, renderer, controls, model, mixer, container, arrow;
let wireModel, mixer1, current, magnet, direction, mField;
let leftHand;
let coilModel, mixer2, currentwire, arrow1, arrow2, direction1, direction2;
let actions = {};
const modelPath = '../model/';
const elements = {
    '1': 'elements.glb',
    '2': 'ForceonWire.glb',
    '3': 'lefthandrule.glb',
    '4': 'ForceonCoil.glb',
    '5': 'magnet.glb'
};

//button and html elements
let message = "";
let messageEl = document.getElementById("message-el");
let conductorEl = document.getElementById("conductor-el");
let equationEl = document.getElementById("equations-el");
let ruleEl = document.getElementById("rule-el");
let closeRule = document.getElementById( "closerule" );
const buttonSlowEl = document.getElementById("slow-el");

const buttonWireEl = document.getElementById( 'wire-el' );
const buttonCoilEl = document.getElementById( 'coil-el' );

const buttonFlip = document.getElementById( 'flip-el' );
const buttonFlow = document.getElementById( 'flow-el' );
const buttonDirection = document.getElementById( 'direction-el' );
const buttonHand = document.getElementById( 'hand-el' );

// Load armature coil scene
buttonCoilEl.addEventListener('click', function () {
    buttonWireEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonCoilEl.style.backgroundColor="rgb(3, 67, 97)";
    message = "Investigate the force on Armature Coil held within the magnetic field ";
    messageEl.textContent = message ;
    ruleEl.style.visibility = "hidden";
    buttonHand.innerHTML = "HAND GESTURE";
    buttonDirection.innerHTML = "FORCE DIRECTION";
    buttonSlowEl.style.visibility = "hidden";
    element = 1;
    flow = false;
    flip = false;
    hGesture = false;
    setCamera();
    stopAllaction();
    scene.add(coilModel);
    render();
    
    
});

// Load the Almunium rod scene
buttonWireEl.addEventListener('click', function () {
    buttonCoilEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonWireEl.style.backgroundColor="rgb(3, 67, 97)";
    message = "Investigate the force on current carrying Almunium Rod held within the magnetic field ";
    ruleEl.style.visibility = "hidden";
    buttonHand.innerHTML = "HAND GESTURE";
    buttonDirection.innerHTML = "MAGNETIC POLARITY";
    buttonSlowEl.style.visibility = "hidden";
    messageEl.textContent = message ;
    element = 0;
    flow = false;
    flip = false;
    hGesture = false
    setCamera();
    stopAllaction();
    scene.add(wireModel);
    scene.add(magnet);
    render();
    
});

// Left hand gesture showing the three mutually perpendicular vectors
buttonHand.addEventListener('click', function () {
    if (flow) {
        handGesture();
    } else {
        scene.remove(leftHand);
        message = "SWITCH ON";
        messageEl.textContent = message ;
    }
});

// current flow action switch
buttonFlow.addEventListener('click', function () {

    if (element === 0) {
        actions['needleL'].reset().stop();
        actions['currentleft'].reset().stop();
        actions['left'].reset().stop();
        actions['currentright'].reset().stop();
        actions['right'].reset().stop();
        actions['currentleftR'].reset().stop();
        actions['currentrightR'].reset().stop();
        currentFlow();
        
    } else if (element === 1) {
        actions['clockwise'].reset().stop();
        actions['counterclockwise'].reset().stop();
        actions['arrow1flip'].reset().stop();
        actions['arrowflip'].reset().stop();
        actions['arrow1flipR'].reset().stop();
        actions['arrowflipR'].reset().stop();
        armatureFlow();  
        buttonSlowEl.disabled = false;
        buttonSlowEl.style.cursor = 'pointer'; 
        slow = false;
    }
    
});

// polarity flip button
buttonFlip.addEventListener('click', function () { 
    actions['polarity1'].reset().stop();
    actions['polarity'].reset().stop();
    actions['needleL'].reset().stop();
    actions['clockwise'].reset().stop();
    actions['counterclockwise'].reset().stop();
    actions['currentleft'].reset().stop();
    actions['left'].reset().stop();
    actions['currentright'].reset().stop();
    actions['right'].reset().stop();
    scene.remove(leftHand);
    direction.visible = false;
    ruleEl.style.visibility = "hidden";
    buttonHand.innerHTML = "HAND GESTURE";
    direction1.visible = false;
    direction2.visible = false;
    currentwire.visible = false;
    arrow1.visible = false;
    arrow2.visible = false;
    current.visible = false;
    conductorEl.textContent = "------------------------------------------------ " ;
    //ruleEl.style.visibility = "hidden";
    buttonSlowEl.style.visibility = "hidden";
   
    polarity();
});

//armature rotation in slow motion
buttonSlowEl.addEventListener('click', function () {
    slow = true;
    actions['clockwise'].reset().stop();
    actions['arrow1flip'].reset().stop();
    actions['arrowflip'].reset().stop();
    actions['counterclockwise'].reset().stop();
    actions['arrow1flipR'].reset().stop();
    actions['arrowflipR'].reset().stop();
    slowarmatureAction();
    
});


buttonDirection.addEventListener('click', function () {
    
    if (element === 0 && !flow ) {
        conductorEl.textContent = "------------------------------------------------ " ;
        scene.remove(leftHand);
        magnetRotation();
    } else if (element === 1) {
        forceDirection();
    } else{
        message = "SWITCH OFF";
        messageEl.textContent = message ;
    }
    
});

closeRule.addEventListener('click', function() {
    ruleEl.style.visibility = "hidden";
});

function slowarmatureAction() {
    
    if (!flip  && slow ) {
        currentwire.visible = true;
        currentwire.morphTargetInfluences[0] = 0;
        arrow1.visible = true;
        arrow2.visible = true;
        // flow = true;
        buttonSlowEl.disabled = true;
        buttonSlowEl.style.cursor = 'default';
        actions['clockwise'].setDuration( 25 ).play();
        actions['arrow1flip'].setDuration( 25 ).play();
        actions['arrowflip'].setDuration( 25 ).play();
        conductorEl.textContent = "CLICK ON FORCE DIRECTION" ;
        message = " SLOW MOTION: Current flows from A to B into the armature coil, Force exerted on the coil makes it rotate clockwise";
        messageEl.textContent = message ;
        animate();
        
        slow = true;
    } else if (flip  && slow ) {
        currentwire.visible = true;
        currentwire.morphTargetInfluences[0] = 1;
        arrow1.visible = true;
        arrow2.visible = true;
        // flow = true;
        buttonSlowEl.disabled = true;
        buttonSlowEl.style.cursor = 'default';
        actions['counterclockwise'].setDuration( 25 ).play();
        actions['arrow1flipR'].setDuration( 25 ).play();
        actions['arrowflipR'].setDuration( 25 ).play();
        conductorEl.textContent = "CLICK ON FORCE DIRECTION" ;
        message = " SLOW MOTION: Current flows from B to A, , Force exerted on the coil make it rotate counterclockwise";
        messageEl.textContent = message ;
        animate();
        
        slow = true;
    } else {
        buttonSlowEl.style.visibility = "hidden";
        slow = false;
        currentwire.visible = false;
        arrow1.visible = false;
        arrow2.visible = false;
        message = " SWITCH OFF";
        messageEl.textContent = message ;
        conductorEl.textContent = "CLICK ON SWITCH BUTTON" ;
    }
}

function handGesture() {
    if (element === 0 && !hGesture ) {

        leftHand.position.set( -1, 1, 0.7 );
        
        scene.add(leftHand);
        ruleEl.style.visibility = "visible";
        hGesture = true;
        buttonHand.innerHTML = "HIDE GESTURE";

    } else if (element === 1 && !hGesture ) {

        leftHand.position.set( -1, 1, 1.3 );
        leftHand.rotation.set(-1.57, 1.57, 0);
        scene.add(leftHand);
        ruleEl.style.visibility = "visible";
        hGesture = true;
        buttonHand.innerHTML = "HIDE GESTURE";
           
    } else {
        scene.remove(leftHand);
        ruleEl.style.visibility = "hidden";
        hGesture = false;
        buttonHand.innerHTML = "HAND GESTURE" 
    }
    render(); 
}

function polarity( ) {
    
    if (!flip ) {      
        actions['polarity1'].setDuration( .5 ).play();
        flow = false;    
        flip = true;
        message = "Polarity Changed. B is now the + terminal";
        messageEl.textContent = message ;
    } else if (flip ) { 
        actions['polarity'].setDuration( .5 ).play();
        flow = false;    
        flip = false;
        message = "Polarity Changed. A is now the + terminal";
        messageEl.textContent = message ;
    } 
    animate();
}

function currentFlow( ) {

    if (!flip  && !flow  &&  !mrotate  && element === 0 ) {
        actions['needleL'].setDuration( 5 ).play();
        
        current.visible = true;
        setTimeout(function(){  
                  
            actions['left'].setDuration( 5 ).play();
            actions['currentleft'].setDuration( 5 ).play();
            setTimeout(function(){
                
                leftHand.rotation.set(0,0,0);
                direction.morphTargetInfluences[0] = 1;
                direction.morphTargetInfluences[1] = 0;
                direction.morphTargetInfluences[2] = 0;
                direction.visible = true;
            }, 1500); 
            
          }, 1000); 
        flow = true;
        conductorEl.textContent = "Blue pointer indicates the field direction, Green pointer indicates the current direction, red pointer indicates the force direction" ;
        message = " Current flows from A to B, Force exerted on the Rod is as shown by the pointer";
        messageEl.textContent = message ;
        animate();
        
    } else if (flip  && !flow && !mrotate && element === 0) {
        actions['needleL'].setDuration( 5 ).play();
        current.visible = true;
        setTimeout(function(){
            
            actions['right'].setDuration( 5 ).play();
            actions['currentright'].setDuration( 5 ).play();
            
            setTimeout(function(){
                leftHand.rotation.set(0,3.14,0);
                direction.morphTargetInfluences[0] = 0;
                direction.morphTargetInfluences[1] = 0;
                direction.morphTargetInfluences[2] = 1;
                direction.visible = true;
            }, 1500);
          }, 1000); 
        flow = true; 
        conductorEl.textContent = "Blue pointer indicates the field direction, Green pointer indicates the current direction, red pointer indicates the force direction" ;
        message = " Current flows from B to A, Force exerted on the Rod is as shown by the pointer";
        messageEl.textContent = message ;
        animate();
        
    }  else if (!flip  && !flow && mrotate && element === 0) {
        actions['needleL'].setDuration( 5 ).play();
        current.visible = true;
        setTimeout(function(){
            actions['right'].setDuration( 5 ).play();
            actions['currentrightR'].setDuration( 5 ).play();
            setTimeout(function(){
                leftHand.rotation.set(0,0,3.14);
                direction.morphTargetInfluences[0]  = 0;
                direction.morphTargetInfluences[1]  = 1;
                direction.morphTargetInfluences[2]  = 0;
                direction.visible = true;
            }, 1500);
          }, 1000); 
        flow = true; 
        conductorEl.textContent = "Blue pointer indicates the field direction, Green pointer indicates the current direction, red pointer indicates the force direction" ;
        message = "Current flows from A to B, Force exerted on the Rod is as shown by the pointer";
        messageEl.textContent = message ;
        animate();
        
    } else if (flip && !flow && mrotate && element === 0) {
        actions['needleL'].setDuration( 5 ).play();
        current.visible = true;
        setTimeout(function(){
            actions['left'].setDuration( 5 ).play();
            actions['currentleftR'].setDuration( 5 ).play();
            setTimeout(function(){
                leftHand.rotation.set(0,3.14,3.14);
                direction.morphTargetInfluences[0]  = 1;
                direction.morphTargetInfluences[1]  = 1;
                direction.morphTargetInfluences[2]  = 1;
                direction.visible = true;
            }, 1500);
          }, 1000); 
        flow = true; 
        conductorEl.textContent = "Blue pointer indicates the field direction, Green pointer indicates the current direction, red pointer indicates the force direction" ;
        message = "Current flows from B to A, Force exerted on the Rod is as shown by the pointer";
        messageEl.textContent = message ;
        animate();
        
    } else { 
        actions['needleL'].fadeOut();
        actions['left'].fadeOut();
        actions['currentleft'].fadeOut();
        actions['right'].fadeOut();
        actions['currentright'].fadeOut();
        actions['currentleftR'].fadeOut();      
        actions['currentrightR'].fadeOut();  
        flow = false;  
        conductorEl.textContent = "------------------------------------------------ " ;
        message = "No Current Flows, Switch OFF, rod position restored";
        messageEl.textContent = message;
        direction.visible = false;  
        current.visible = false;
        animate();          
    }
    
}

function armatureFlow( ) {
   
    if (!flip && !flow  ) {
        currentwire.visible = true;
        currentwire.morphTargetInfluences[0] = 0;
        arrow1.visible = true;
        arrow2.visible = true;
        flow = true;
        actions['needleL'].setDuration( .5 ).play();
        actions['clockwise'].play();
        actions['arrow1flip'].play();
        actions['arrowflip'].play();
        conductorEl.textContent = "CLICK on SLOW for SLOW-MOTION & FORCE DIRECTION for CURRENT, FIELD and FORCE vectors " ;
        message = " Current flows from A to B into the armature coil; Force exerted on the two arms of the armature coil are opposite making it rotate clockwise";
        messageEl.textContent = message ;
        animate();
        buttonSlowEl.style.visibility = "visible";
    } else if (flip && !flow ) {
        currentwire.visible = true;
        currentwire.morphTargetInfluences[0] = 1;
        arrow1.visible = true;
        arrow2.visible = true;
        flow = true;
        actions['needleL'].setDuration( .5 ).play();
        actions['counterclockwise'].play();
        actions['arrow1flipR'].play();
        actions['arrowflipR'].play(); 
        conductorEl.textContent = "CLICK ON FORCE DIRECTION" ;
        message = " Current flows from B to A, , Force exerted on the coil make it rotate counterclockwise";
        messageEl.textContent = message ;
        animate();
        buttonSlowEl.style.visibility = "visible";
    } else { 
        actions['needleL'].stop().reset();
        actions['clockwise'].stop().reset();
        actions['counterclockwise'].stop().reset();
        flow = false;  
        currentwire.visible = false;
        direction1.visible = false;
        direction2.visible = false;
        arrow1.visible = false;
        arrow2.visible = false;
        buttonSlowEl.style.visibility = "hidden";
        conductorEl.textContent = "------------------------------------------------ " ;
        message = "No Current Flows, Switch OFF, rod position restored";
        messageEl.textContent = message;
        scene.remove(leftHand);  
        
        animate();          
    }
    
}

function magnetRotation() {
    if (!mrotate) {
         mField.rotation.set( 3.14, 0, 0 );
         mrotate = true;
         message = "Magnet Polarity Changed. Field directed DOWNWARD";
         messageEl.textContent = message ;
    } else if (mrotate ) {
        mField.rotation.set( 0, 0, 0 );
         mrotate = false;
         message = "Magnet Polarity Changed. Field directed UPWARD";
         messageEl.textContent = message ;
    } 
     animate(); 
}
 
function forceDirection() {
     if (!flip  && flow  && !fDirection) {
         actions['direction1'].reset().stop();
         actions['direction2'].reset().stop();
         direction1.visible = true;
         direction2.visible = true;
         conductorEl.textContent = "FORCE ON THE TWO ARMS:- Blue pointer indicates the magnetic field, Green pointer indicates the current, red pointer indicates the force direction" ;
         buttonDirection.textContent = "HIDE DIRECTION";
         fDirection = true;
         
     } else if (flip  && flow  && !fDirection) { 
         actions['direction1'].setDuration(.01).play();
         actions['direction2'].setDuration(.01).play();
         direction1.visible = true;
         direction2.visible = true;
         conductorEl.textContent = "FORCE ON THE TWO ARMS:- Blue pointer indicates the magnetic field, Green pointer indicates the current, red pointer indicates the force direction";
         buttonDirection.textContent = "HIDE DIRECTION";
         fDirection = true;
     } else if (fDirection) {
         fDirection =false;
         direction1.visible = false;
         direction2.visible = false;
         buttonDirection.textContent = "FORCE DIRECTION";
         
     }
}
 
function stopAllaction() {
    actions['polarity1'].reset().stop();
    actions['polarity'].reset().stop();
    actions['needleL'].reset().stop();
    actions['clockwise'].reset().stop();
    actions['counterclockwise'].reset().stop();
    actions['currentleft'].reset().stop();
    actions['left'].reset().stop();
    actions['currentright'].reset().stop();
    actions['right'].reset().stop();
    actions['arrow1flip'].reset().stop();
    actions['arrowflip'].reset().stop();
    actions['arrow1flipR'].reset().stop();
    actions['arrowflipR'].reset().stop();
    actions['direction1'].reset().stop();
    actions['direction2'].reset().stop();
    scene.remove(leftHand);
    scene.remove(coilModel);
    scene.remove(wireModel);
    scene.remove(magnet);
    
    current.visible = false;
    direction.visible = false;
    arrow1.visible = false;
    arrow2.visible = false;
    currentwire.visible = false;
}

init();
render();

function setCamera() {
    
    if (element === 0) {
        fov = 40;
        camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        camera.position.set(5, 3, 5);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(0, 0, 0);
        controls.update();
        render();
        
    } else if (element === 1) {
        fov = 20;
        camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        camera.position.set(5, 5, 5);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(0.4, 0.4, 0);
        controls.update();  
        render();
    }
    
}



//Add a coil

function init() {
    container = document.getElementById('container');

	renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.alpha = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    fov = 40;
    aspect = window.innerWidth / window.innerHeight; 
	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    camera.position.set(5, 3, 5);
    
	scene = new THREE.Scene();
	scene.add( new THREE.GridHelper( 10, 10) );
    scene.background = new THREE.Color(0xbfd1e5);

    let hemiLight = new THREE.AmbientLight(0xffffff, .20);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    let pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(5, 2, 2);
    scene.add(pointLight);
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-30, 50, -30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 70;
    dirLight.shadow.camera.bottom = -70;
    dirLight.shadow.camera.left = -70
    dirLight.shadow.camera.right = 70;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    stats = new Stats();
    clock = new THREE.Clock();
    container.appendChild(stats.dom);

	controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
	controls.update();
    
	controls.addEventListener( 'change', render );	

    const loader = new GLTFLoader();
    //load Main model
    loader
        .setPath(modelPath)
        .load(elements['1'], function (gltf) {
            model = gltf.scene;
            mixer = new THREE.AnimationMixer(model);
            arrow = model.getObjectByName('arrow');
            scene.add(model);
            arrow.visible = false;
            renderer.render( scene, camera );
        
            let fixedStates = ['polarity1', 'polarity', 'needleL'];
            for (let i = 0; i < gltf.animations.length; i++) {

                let clip = gltf.animations[i];
                let action = mixer.clipAction(clip);
                actions[clip.name] = action;

                if (fixedStates.indexOf(clip.name) >= 0) {
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                    //console.log(i, clip.name, fixedStates.indexOf(clip.name) )
                }
            }
    });
        
    //load Alumininum rod model
    loader
        .setPath(modelPath)
        .load(elements['2'], function (gltf) {
            wireModel = gltf.scene;
            current = wireModel.getObjectByName('current');
            mixer1 = new THREE.AnimationMixer(wireModel);
            scene.add(wireModel);
            renderer.render( scene, camera );
            
            //buttonDirection.innerHTML = "FORCE DIRECTION"
            let fixedStates = ['currentleft', 'currentleftR', 'currentright', 'currentrightR', 'right', 'left'];
    

            for (let i = 0; i < gltf.animations.length; i++) {

                let clip = gltf.animations[i];
                let action = mixer1.clipAction(clip);
                actions[clip.name] = action;

                if (fixedStates.indexOf(clip.name) >= 0) {
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                    // action.repetitions = 1;
                }
            }
    });

    //load Left Hand gesture
    loader
        .setPath(modelPath)
        .load(elements['3'], function (gltf) {
            leftHand = gltf.scene;
            gltf.scene.traverse((child) => {
                if (child.type == 'SkinnedMesh') {
                    child.frustumCulled = false;
                }
            });
           
        });
//load Armature Coil model
    loader
        .setPath(modelPath)
        .load(elements['4'], function (gltf) {
            coilModel = gltf.scene;
            mixer2 = new THREE.AnimationMixer(coilModel);

            currentwire = gltf.scene.getObjectByName('currentwire');
            arrow1 = gltf.scene.getObjectByName('arrow1');
            arrow2 = gltf.scene.getObjectByName('arrow2');
            direction1 = gltf.scene.getObjectByName('direction1');
            direction2 = gltf.scene.getObjectByName('direction2');
            direction1.visible = false;
            direction2.visible = false;
            currentwire.visible = false;
            arrow1.visible = false;
            arrow2.visible = false;
            let fixedStates = ['direction1', 'direction2'];


            for (let i = 0; i < gltf.animations.length; i++) {

                let clip = gltf.animations[i];
                let action = mixer2.clipAction(clip);
                actions[clip.name] = action;
                if (fixedStates.indexOf(clip.name) >= 0) {
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                    //console.log(i, clip.name, fixedStates.indexOf(clip.name) )
                }

            }
            
        });

    //load magnet
    loader
        .setPath(modelPath)
        .load(elements['5'], function (gltf) {
            magnet = gltf.scene;
            gltf.scene.traverse((child) => {
                if (child.type == 'SkinnedMesh') {
                    child.frustumCulled = false;
                }
            });  
            direction = magnet.getObjectByName('direction');
            mField = magnet.getObjectByName('Magnet');
            scene.add(magnet);
            direction.visible = false;
            render(); 
    });   
    
	window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

	aspect = window.innerWidth / window.innerHeight;

	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	//render();

}

function render() {

	renderer.render( scene, camera );

}


function animate() {
	requestAnimationFrame( animate );
    const delta = clock.getDelta();
    mixer.update(delta);
    mixer1.update(delta);
    mixer2.update(delta);
    controls.update();

    stats.update();

	render();
};
