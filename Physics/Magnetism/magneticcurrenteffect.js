import * as THREE from '../../build/three.module.js'
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import  Stats  from '../../jsm/libs/stats.module.js';

let button;
let element = 1;
let flip = 0;
let flow = 0;
let wire, coil, arrow, solenoid, toroid, MFwire, MFcoil, MFsolenoid, MFtoroid, NSsolenoid, NScoil, NStoroid;
let mixer;
let model, scene, camera, controls, fov, renderer, clock, stats;
let hidden = true, requestID;
let actions = {};
const modelPath = '../model/';
const elements = {
    '1': 'elements.glb',
    '2': 'conductors.glb'
};
const formulas = {
    '1': '../assets/Magformula/longwire.png',
    '2': '../assets/Magformula/coil.png',
    '3': '../assets/Magformula/solenoid.png',
    '4': '../assets/Magformula/toroid.png'
};
let message = "";
let messageEl = document.getElementById("message-el");
let equationEl = document.getElementById("equations-el");
let eqnViewer = document.getElementById("eqnviewer");
let ruleEl = document.getElementById("rule-el");
let close = document.getElementById("close");

const buttonWireEl = document.getElementById('wire-el');
const buttonCoilEl = document.getElementById('coil-el');
const buttonSolenoidEl = document.getElementById('solenoid-el');
const buttonToroidEl = document.getElementById('toroid-el');
const buttonFlip = document.getElementById('flip-el');
const buttonFlow = document.getElementById('flow-el');
const buttonFormula = document.getElementById('formula-el');
const buttonReset = document.getElementById('reset-el');


function init() {
    //scene
    const container = document.getElementById('container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    //camera
    fov = 35
    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3, 5);
    //camera.rotation.set(0, -(Math.PI*2), 0);
    stats = new Stats();
    clock = new THREE.Clock();
    container.appendChild(stats.dom);
    //renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.alpha = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    //renderer.shadowMap.enabled = true;
    //container.appendChild( renderer.domElement );
    container.appendChild(renderer.domElement);

    //cameracontrols
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(1, .8, 0);
    controls.update();

    controls.addEventListener('change', render);
    //create light 
    let hemiLight = new THREE.AmbientLight(0xffffff, .20);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

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

    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    const loader = new GLTFLoader();
    //load conductor elements, coil,wire, solenoid
    loader
        .setPath(modelPath)
        .load(elements['2'], function (gltf) {

            coil = gltf.scene.getObjectByName('coil');
            wire = gltf.scene.getObjectByName('wire');
            solenoid = gltf.scene.getObjectByName('solenoid');
            toroid = gltf.scene.getObjectByName('toroid');
            MFcoil = gltf.scene.getObjectByName('MFcoil');
            MFtoroid = gltf.scene.getObjectByName('MFtoroid');
            NSsolenoid = gltf.scene.getObjectByName('N-Ssolenoid');
            NScoil = gltf.scene.getObjectByName('N-Scoil');
            MFwire = gltf.scene.getObjectByName('MFwire');
            MFsolenoid = gltf.scene.getObjectByName('MFsolenoid');
            NStoroid = gltf.scene.getObjectByName('N-Storoid');
            scene.add(coil);
        })

    //load Main model


    loader
        .setPath(modelPath)
        .load(elements['1'], function (gltf) {
            model = gltf.scene;
            arrow = model.getObjectByName('arrow');
            mixer = new THREE.AnimationMixer(model);
            scene.add(model);
            console.log(arrow);
            arrow.morphTargetInfluences[0] = 1;
            arrow.morphTargetInfluences[1] = 0;
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
            console.log(actions);
           

        }, undefined, function (e) {

            console.error(e);

        });
    window.addEventListener("resize", onWindowResize);
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
        render();
        
    } else if (button === 0) {
        fov = 20;
        camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(5, 5, 5);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(1, 1, 0);
        controls.update();  
        render();
    }
    cancelAnimationFrame(animate);
}

function currentFlow( ) {
    actions['needleL'].stop()
    if (flip === 0 && flow === 0 && element === 0 ) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 0;
            scene.add(MFwire);
            MFwire.position.set(-0.6, 0, -1.2);
            MFwire.rotation.set(0, 0, 0);
          }, 1000); 
        flow = 1;

        message = " Magnetic Effect due to a straight Wire Carrying Current ";
        messageEl.textContent = message ;
        ruleEl.style.visibility = "visible";
        
    } else if (flip === 1 && flow === 0 && element === 0) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 1;
            scene.add(MFwire);
            MFwire.position.set(-0.6, 0, -1.2);
            MFwire.rotation.set(0, 3.14, 0);
          }, 1000); 
        flow = 1; 
        message = " Magnetic Effect due to a straight Wire Carrying Current";
        messageEl.textContent = message ;
        ruleEl.style.visibility = "visible";
        
    } else if (flip === 0 && flow === 0 && element === 1 ) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 0;
            MFcoil.rotation.set(0, 0, 0);
            scene.add(MFcoil);
            setTimeout(function(){
                NScoil.rotation.set(0, 0, 0);
                scene.add(NScoil);
                setTimeout(function(){
                   
                    fieldRotation(MFcoil);
                    
                  }, 500);
              }, 1000);
            
          }, 1000); 
        flow = 1;
        message = "Current Flows from A to B, magnetic fields created around the coil";
        messageEl.textContent = message ;
        
    } else if (flip === 1 && flow === 0 && element === 1) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 1;
            MFcoil.rotation.set(0, 3.14, 0);
            scene.add(MFcoil);
           
            setTimeout(function(){
                NScoil.rotation.set(3.14, 3.14, 0);
                scene.add(NScoil);
                
                setTimeout(function(){
                    
                    fieldRotation();
                    
                  }, 500); 
              }, 1000); 
            
          }, 1000); 
        flow = 1; 
        message = "Current Flows from B to A, magnetic fields created around the coil";
        messageEl.textContent = message ;
        
    }else if (flip === 0 && flow === 0 && element === 2 ) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 0;
            scene.add(MFsolenoid);
            MFsolenoid.rotation.set(3.14, 3.14, 0);
            setTimeout(function(){
                scene.add(NSsolenoid);
                NSsolenoid.rotation.set(0, 3.14, 3.14);
                NSsolenoid.position.z = -.1;
              }, 1000);
          }, 1000); 
        flow = 1;
        message = "Current Flows from A to B through the coiled wire loops creating parallel strong magnetic field inside the solenoid and relatively weak field at external points. Shows North and South Poles";
        messageEl.textContent = message ;
        
    } else if (flip === 1 && flow === 0 && element === 2) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 1;
            scene.add(MFsolenoid);
            MFsolenoid.rotation.set(0, 3.14, 0);
            setTimeout(function(){
                scene.add(NSsolenoid);
                NSsolenoid.rotation.set(0, 0, 0);
                NSsolenoid.position.z = -.2;
              }, 1000);
            
          }, 1000); 
        flow = 1; 
        message = "Current Flows from B to A through the coiled wire loops creating parallel strong magnetic field inside the solenoid and relatively weak field at external points. North and South Poles reversed";
        messageEl.textContent = message ;
       
    }else if (flip === 0 && flow === 0 && element === 3 ) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 0;
           
            scene.add(MFtoroid);
            setTimeout(function(){
                    
                fieldRotation();
                
              }, 500); 
          }, 1000); 
        flow = 1;
        message = "A toroid is a curved hollow solenoid (whose ends meets), the lines of magnetic fields form concentric circles inside the toroid. When Current Flows from A to B its in counterclockwise direction";
        messageEl.textContent = message ;
        
    } else if (flip === 1 && flow === 0 && element === 3) {
        actions['needleL'].setDuration( 5 ).play();
        setTimeout(function(){
            arrow.morphTargetInfluences[0] = 0;
            arrow.morphTargetInfluences[1] = 1;
            scene.add(NStoroid);
            setTimeout(function(){
                    
                fieldRotation();
                
              }, 500); 
            
          }, 1000); 
        flow = 1; 
        message = "A toroid is a curved hollow solenoid (whose ends meets), the lines of magnetic fields form concentric circles inside the toroid. When Current Flows from B to A its in clockwise direction";
        messageEl.textContent = message ;
        
    } else {
        
        actions['needleL'].fadeOut();
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
       
        flow = 0;  
        message = "No Current Flows, Switch OFF";
        messageEl.textContent = message;
            
    }
    animate();
    // requestAnimationFrame(currentFlow);
}

function polarity( ) {
    
    if (flip === 0 ) {
        actions['polarity'].fadeOut();
        actions['needleL'].fadeOut();
       
        actions['polarity1'].setDuration(2 ).play();
        
        flow = 0;    
        flip = 1;
        message = "Polarity Changed. B is now the + terminal";
        messageEl.textContent = message ;
        
        animate(); 

    } else if (flip === 1 ) { 
        actions['polarity1'].fadeOut();
        actions['needleL'].fadeOut();
        
        actions['polarity'].setDuration(2).play();
        
        flow = 0;    
        flip = 0;
        message = "Polarity Changed. A is now the + terminal";
        messageEl.textContent = message ;
        
        animate();
    } 
    // requestAnimationFrame(polarity);
}

function fieldRotation(){
    
    MFcoil.rotation.x += .01;
    MFtoroid.rotation.x += .01;
    NStoroid.rotation.x -= .01;
    requestAnimationFrame(fieldRotation)
}

 
function render() {

	renderer.render( scene, camera );

}


function buttonAction() {
   
    if (hidden === true) {
        equationEl.style.visibility = 'visible';
        
        buttonFormula.style.backgroundColor="rgb(3, 67, 97)";
    } else {
        equationEl.style.visibility = 'hidden';
        buttonFormula.style.backgroundColor="rgb(3, 108, 156)";
    }
    hidden = !hidden;
    
}

function formulaDisplay() {
    if (element === 0){
        eqnViewer.src = formulas['1'];
    } else if (element === 1){
        eqnViewer.src = formulas['2'];
    } else if (element === 2){
        eqnViewer.src = formulas['3'];
    } else if (element === 3){
        eqnViewer.src = formulas['4'];
    }
    
}
//window resizing

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}


function animate() {
	
    requestID = requestAnimationFrame( animate );
    
    const delta = clock.getDelta();

    mixer.update(delta);

    controls.update();

    stats.update();

	render();
    
};

function buttonLoad() {
    
    //reset action button
   
    buttonReset.addEventListener('click', function () {
        cancelAnimationFrame(requestID);
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(MFtoroid);
        scene.remove(NStoroid);
        scene.remove(NScoil);
        scene.remove(NSsolenoid);
        scene.remove(wire, coil, solenoid, toroid);
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        actions['needleL'].stop().reset();
        actions['polarity1'].stop().reset();
        actions['polarity'].stop().reset();
        scene.add(coil);
        hidden = false;
        buttonAction();
        buttonCoilEl.style.backgroundColor = "rgb(3, 67, 97)";
        buttonSolenoidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonToroidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonWireEl.style.backgroundColor = "rgb(3, 108, 156)";
        ruleEl.style.visibility = "hidden";
        message = "Magnetic Effect due to a straight Wire Carrying Current ";
        messageEl.textContent = message;
        button = 1;
        flip = 0;
        flow = 0;
        element = 1;
        
        setCamera()
    });

    // polarity flip button
    buttonFlip.addEventListener('click', function () {
        actions['polarity1'].reset();
        actions['polarity'].reset();
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(MFtoroid);
        scene.remove(NStoroid);
        scene.remove(NScoil);
        scene.remove(NSsolenoid);
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        cancelAnimationFrame(requestID);
        polarity();
    });

    // current flow action switch
    buttonFlow.addEventListener('click', function () {
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(MFtoroid);
        scene.remove(NStoroid);
        scene.remove(NScoil);
        scene.remove(NSsolenoid);
        actions['needleL'].stop()
        button = 0;
        cancelAnimationFrame(requestID);
        setCamera()
        currentFlow();
    });

    buttonFormula.addEventListener('click', function () {
        equationEl.style.visibility = "visible";
        ruleEl.style.visibility = "hidden";
        buttonAction();
        formulaDisplay();
        button = 1;
        setCamera();
    });

    // Add a st. wire
    buttonWireEl.addEventListener('click', function () {
        actions['polarity1'].stop().reset();
        actions['polarity'].stop().reset();
        actions['needleL'].stop().reset();
        
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(MFtoroid);
        scene.remove(NScoil);
        scene.remove(NSsolenoid);
        scene.remove(NStoroid);
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        scene.remove(coil);
        scene.remove(solenoid);
        scene.remove(toroid);
        scene.add(wire);
       
        hidden = false;
        buttonAction();
        buttonCoilEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonSolenoidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonToroidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonWireEl.style.backgroundColor = "rgb(3, 67, 97)";
        message = "Magnetic Effect due to a straight Wire Carrying Current ";
        messageEl.textContent = message;
        element = 0;
        flow = 0;
        flip = 0;
        cancelAnimationFrame(requestID);
        button = 1;
        setCamera();
    });

    //Add a coil
    buttonCoilEl.addEventListener('click', function () {
        actions['polarity1'].stop().reset();
        actions['polarity'].stop().reset();
        actions['needleL'].stop().reset();
        scene.remove(wire);
        scene.remove(solenoid);
        scene.remove(toroid);
        scene.remove(MFtoroid);
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(NScoil);
        scene.remove(NSsolenoid);
        scene.remove(NStoroid);
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        hidden = false;
        scene.add(coil);
        
        buttonAction();
        buttonWireEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonSolenoidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonToroidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonFormula.style.backgroundColor = "rgb(3, 108, 156)";
        buttonCoilEl.style.backgroundColor = "rgb(3, 67, 97)";
        ruleEl.style.visibility = "hidden";
        message = "Magnetic Effect due to a single Coil Carrying Current ";
        messageEl.textContent = message;
        element = 1;
        flow = 0;
        flip = 0;
        cancelAnimationFrame(requestID);
        button = 1;
        setCamera();
    });

    //Add a sonenoid
    buttonSolenoidEl.addEventListener('click', function () {
        actions['polarity1'].stop().reset();
        actions['polarity'].stop().reset();
        actions['needleL'].stop().reset();
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(MFtoroid);
        scene.remove(NScoil);
        scene.remove(NSsolenoid);
        scene.remove(NStoroid);
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        scene.remove(wire);
        scene.remove(coil);
        scene.add(solenoid);
        
        hidden = false;
        buttonAction();
        buttonWireEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonCoilEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonToroidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonSolenoidEl.style.backgroundColor = "rgb(3, 67, 97)";
        ruleEl.style.visibility = "hidden";
        message = "Magnetic Effect due to a Solenoid Carrying Current ";
        messageEl.textContent = message;
        element = 2;
        flow = 0;
        flip = 0;
        cancelAnimationFrame(requestID);
        button = 1;
        setCamera();
    });

    //Add a toroid
    buttonToroidEl.addEventListener('click', function () {
        actions['polarity1'].stop().reset();
        actions['polarity'].stop().reset();
        actions['needleL'].stop().reset();
        scene.remove(MFsolenoid);
        scene.remove(MFcoil);
        scene.remove(MFwire);
        scene.remove(MFtoroid);
        scene.remove(NSsolenoid);
        scene.remove(NScoil)
        scene.remove(NStoroid);
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        scene.remove(wire);
        scene.remove(coil);
        scene.remove(solenoid);
        scene.add(toroid);
        hidden = false;
        buttonAction();
        buttonWireEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonCoilEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonSolenoidEl.style.backgroundColor = "rgb(3, 108, 156)";
        buttonToroidEl.style.backgroundColor = "rgb(3, 67, 97)";
        ruleEl.style.visibility = "hidden";
        message = "Magnetic Effect due to a Toroid Carrying Current ";
        messageEl.textContent = message;
        element = 3;
        flow = 0;
        flip = 0;
        cancelAnimationFrame(requestID);
        button = 1;
        setCamera();
    });

    close.addEventListener('click', function () {
        ruleEl.style.visibility = "hidden";
    });
}

window.onload = function() {
    init();
    render();
   
    buttonLoad();
    scene.add(new THREE.AmbientLight(0xffffff, .4));   
}
       