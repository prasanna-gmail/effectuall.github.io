import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import  Stats  from '../../jsm/libs/stats.module.js';


let renderer, container, scene, controls;
let camera, aspect, stats, clock;
let solenoidModel, barMagnet, galvNeedle, inducedSolenoid, galvanometer, mixer;
let powerSupply, powerKnob, connector, arrow, solenoid, rightHand;
let coilModel, coilStand, coil, commutator, rings, insulator, magnetwire, currentwire;
let electromagnet, mixer1, arrow1, arrow2, direction1, direction2;
let actions = {};  
let requestID,
    requestCurrent,
    width = window.innerWidth,
    height =window.innerHeight;

let moveL = false,
    stop = false,
    hold = false,
    relative = false,
    mRotate = false,
    element = 0,
    magZ = -5,
    i = 0,
    fov,
    galvRot = 0,
    galvL = 0.6,
    galvR = -0.6,
    changeFlux = false,
    ruleClues = false,
    flip = false;

const speed = 0.003, magdz = 0.02, needleY = speed/magdz;
let a = 0, coilRotate = false, requestInduced,  requestInducedSlow, coilRotateSlow = false;
const modelPath = '../model/';
const elements = {
    
    '1': 'inducedcurrent.glb',
    '2': 'righthandrule.glb',
    '3': 'ForceonCoil.glb'    
};
    
let message = "";
let messageEl = document.getElementById( "message-el" );
let elementEl = document.getElementById( "element-el" );
let ruleviewer = document.getElementById( "ruleviewer" );
let closeRule = document.getElementById( "closerule" );

const buttonMagnetEl = document.getElementById('magnet-el');
const buttonSolenoidEl = document.getElementById('solenoid-el');
const buttonCoilEl = document.getElementById('coil-el');

// const buttonInduce = document.getElementById('induce-el');
const buttonAction = document.getElementById('action-el');
const buttonStop = document.getElementById('stop-el');
const buttonFlip = document.getElementById('flip-el');
const buttonRelative = document.getElementById('relative-el');
const buttonRule = document.getElementById('rule-el');
 

// Load Induced Solenoid coil (default) scene
buttonMagnetEl.addEventListener('click', function () {
    buttonCoilEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonSolenoidEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonMagnetEl.style.backgroundColor="rgb(3, 67, 97)";
    elementEl.textContent = "Effect of Magnetic Field Change on the Solenoid (Bar Magnet)" ;
    ruleviewer.style.visibility = "hidden";
    buttonAction.innerHTML = "MOVE";
    buttonStop.innerHTML = "STOP";
    buttonRelative.innerHTML = "RELATIVE";
    buttonRule.style.visibility = "hidden";
    element = 0;
   
    // console.log('SOLENOID COIL & MAGNET');
    cancelAnimationFrame(requestInduced);
    cancelAnimationFrame(requestCurrent);
    cancelAnimationFrame( requestID);
    magmodelLoad();
    galvNeedle.rotation.y = 0;
    setCamera();
});

// Load Primary Solenoid coil scene
buttonSolenoidEl.addEventListener('click', function () {
    buttonCoilEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonMagnetEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonSolenoidEl.style.backgroundColor="rgb(3, 67, 97)";
    elementEl.textContent = "Effect of Magnetic Field Change on the Solenoid (Electromagnet)" ;
    message = "CHANGE CURRENT AND SEE THE EFFECTS IN SOLENOID CONNECTED TO THE GALVANOMETER";
    messageEl.textContent = message;
    buttonAction.innerHTML = "CURRENT";
    buttonStop.innerHTML = "HOLD";
    buttonRelative.innerHTML = "RESET";
    ruleviewer.style.visibility = "hidden";   
    buttonRule.style.visibility = "hidden";
    element = 1;

    // console.log('SOLENOID COIL & SOLENOID COIL');
    cancelAnimationFrame(requestInduced);
    cancelAnimationFrame(requestCurrent);
    cancelAnimationFrame( requestID);
    magmodelLoad();
    galvNeedle.rotation.y = 0;
    
    setCamera();
});

// Load armature coil scene
buttonCoilEl.addEventListener('click', function () {
    buttonMagnetEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonSolenoidEl.style.backgroundColor="rgb(3, 108, 156)";
    buttonCoilEl.style.backgroundColor="rgb(3, 67, 97)";
    elementEl.textContent = "Effect of Armature Coil Rotation in Magnetic Field" ;
    message = "MECHANICAL MOTION OF THE ARMATURE COIL INDUCES CURRENT";
    messageEl.textContent = message;
    buttonAction.innerHTML = "ROTATE";
    buttonStop.innerHTML = "STOP";
    buttonRule.style.visibility = "visible";
    ruleviewer.style.visibility = "hidden";
    buttonRelative.innerHTML = "SLOW MOTION";
    rightHand.rotation.set( 0,1.57,-1.57 );
    rightHand.position.set( -0.9,0.5,0.5 );
    visualClues();
    element = 2;
    // console.log('Armature Coil');
    let newMaterial = new THREE.MeshPhongMaterial({color: 0x36454F});
    electromagnet.material = newMaterial;
    setCamera();
    cancelAnimationFrame(requestInduced);
    cancelAnimationFrame(requestCurrent);
    cancelAnimationFrame( requestID);
    magmodelLoad();
    galvNeedle.rotation.y = 0;
});

// Move Button for barMagnet Action... Current Button for Current Change ...Rotate Armature Coil...Induce current...
buttonAction.addEventListener('click', function () {
    if ( element === 0 ) {
        
        buttonAction.disabled = true;
        buttonAction.style.cursor = 'default';
        buttonFlip.disabled = true;
        buttonFlip.style.cursor = 'default';
        magZ = -5;
        moveL = true;
        stop = false;
        i = 0;
        magnetMove();
    } else if ( element === 1 ) {
        arrow.visible = true;
        // console.log('change current in solenoid');
       
        buttonAction.disabled = true;
        buttonAction.style.cursor = 'default';
        buttonFlip.disabled = true;
        buttonFlip.style.cursor = 'default';
        supplyCurrent();
    } else if ( element === 2 ) {
        coilRotate = true;
        stop = false;
        message = "Rotating the armature coil in magnetic field Induces AC current in the Galvanometer";
        messageEl.textContent = message;
        // console.log('Induced AC current flows in Galvanometer');
        inducedCurrent();
       
        buttonAction.disabled = true;
        buttonAction.style.cursor = 'default'; 
        currentwire.morphTargetInfluences[1]= 1;
    }
    
});

//Relative Button for barMagnet and Solenoid Move  ... Reset Button for Current Settings....Slow Motion Armature Coil
buttonRelative.addEventListener('click', function () {
    if ( element === 0 ) {
        relative = true;
        magZ = -5;
        barMagnet.position.z =-4;
        relativeMove();
        // console.log("move both solenoid and magnet");
    
    } else if ( element === 1 ) {
        // console.log('Reset knob');
        arrow.visible = false;
        actions['needleL'].reset().stop();
        galvRot = 0;
        galvL = 0.4;
        galvR = -0.4;
        changeFlux = false;
        hold = false;
        stop = false;
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        render();
    } else if ( element === 2 ) {
        // console.log('In slow motion');
        coilRotateSlow = true;
        stop =false;
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        cancelAnimationFrame( requestInduced );
        message = "AMATURE COIL ENDS CONNECTED TO THE TWO RINGS ROTATES WITH THE ROTATING ROD ";
        messageEl.textContent = message;
        insulator.scale.set(0,0,0);
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        inducedCurrentSlow();
    }
    
});

//Rotate the armature coil clockwise on action button click
function  inducedCurrent() {
    if (!flip) {
        a += -.05;
        requestInduced = requestAnimationFrame(inducedCurrent);
        visualClues();
        commutator.rotation.x += -.05;
        galvNeedle.rotation.y = Math.cos(a);
        arrow1.rotation.x = 3.14 * Math.abs(Math.ceil(Math.cos(a))) ;
        arrow2.rotation.z = 3.14 * Math.abs(Math.ceil(Math.cos(a)));
        currentwire.morphTargetInfluences[0] = Math.abs(Math.ceil(Math.cos(a)));
        direction1.morphTargetInfluences[0] = 0;
        direction2.morphTargetInfluences[0] = 1;
        direction1.morphTargetInfluences[1] = 0;
        direction2.morphTargetInfluences[1] = 0;
        render()
    } else if (flip) {
        a += -.05;
        requestInduced = requestAnimationFrame(inducedCurrent);
        visualClues();
        commutator.rotation.x += -.05;
        galvNeedle.rotation.y = Math.cos(a);
        arrow1.rotation.x = 3.14 * Math.floor(Math.cos(a));
        arrow2.rotation.z =  3.14 * Math.floor(Math.cos(a));
        currentwire.morphTargetInfluences[0] = Math.abs(Math.floor(Math.cos(a)));
        direction1.morphTargetInfluences[0] = 1;
        direction2.morphTargetInfluences[0] = 0;
        direction1.morphTargetInfluences[1] = 1;
        direction2.morphTargetInfluences[1] = 1;
        render()
    }
    
}

function visualClues() {
    if (stop ) {
        arrow1.visible = false;
        arrow2.visible = false;
        direction1.visible = false;
        direction2.visible = false;
        currentwire.visible = false;
        scene.remove(rightHand);
        
    } else if (coilRotate && !stop){
        arrow1.visible = true;
        arrow2.visible = true;
        direction1.visible = true;
        direction2.visible = true;
        currentwire.visible = true;
        // scene.add(rightHand);
    } else if ( coilRotateSlow && !stop) {
        arrow1.visible = true;
        arrow2.visible = true;
        direction1.visible = true;
        direction2.visible = true;
        currentwire.visible = true;
       
        // rightHand.visible = true;
    } 
    
}

function inducedCurrentSlow() {
    if (!flip) {
        a += -.002;
        requestInducedSlow = requestAnimationFrame(inducedCurrentSlow);
        commutator.rotation.x += -.002;
        // console.log('magnet NS');
        galvNeedle.rotation.y = Math.cos(a);
        arrow1.rotation.x = 3.14 * Math.abs(Math.ceil(Math.cos(a))) ;
        arrow2.rotation.z = 3.14 * Math.abs(Math.ceil(Math.cos(a)));
        
        currentwire.morphTargetInfluences[0] = Math.abs(Math.ceil(Math.cos(a)));
        direction1.morphTargetInfluences[0] = 0;
        direction2.morphTargetInfluences[0] = 1;
        direction1.morphTargetInfluences[1] = 0;
        direction2.morphTargetInfluences[1] = 0;
        rightHand.rotation.set( 0,1.57,-1.57 );
        visualClues()
        render()
    } else if (flip) {
        a += -.002;
        requestInducedSlow = requestAnimationFrame(inducedCurrentSlow);
        commutator.rotation.x += -.002;
        // console.log('magnet SN');
        galvNeedle.rotation.y = Math.cos(a);
        arrow1.rotation.x = 3.14 * Math.floor(Math.cos(a));
        arrow2.rotation.z =  3.14 * Math.floor(Math.cos(a));
        // console.log(Math.floor(Math.cos(a)));
        currentwire.morphTargetInfluences[0] = Math.abs(Math.floor(Math.cos(a)));
        direction1.morphTargetInfluences[0] = 1;
        direction2.morphTargetInfluences[0] = 0;
        direction1.morphTargetInfluences[1] = 1;
        direction2.morphTargetInfluences[1] = 1;
        rightHand.rotation.set( 0,-1.57,-1.57 );
        visualClues()
        render()
    }
    
}
//Change Current Polarity in the supply circuit
function polarity( ) {
    
    if (!flip  ) {
        actions['polarity'].fadeOut();
        actions['needleL'].fadeOut();
        actions['needleL'].reset().stop();
        actions['polarity1'].setDuration( .5 ).play();   
        flip = true;
        message = "Polarity Changed. B is now the + terminal";
        messageEl.textContent = message ;
        
         

    } else if (flip ) { 
        actions['polarity1'].fadeOut();
        actions['needleL'].fadeOut();
        actions['needleL'].reset().stop();
        actions['polarity'].setDuration( .5 ).play();  
        flip = false;
        message = "Polarity Changed. A is now the + terminal";
        messageEl.textContent = message ;
        
        
    } 
    animate();
}

//Change Current in primary coil and study the effect in galvanometer
function supplyCurrent() {
   
    if (!flip  && !hold ) {
        console.log('SWITCH ON')
        arrow.visible = true;
        console.log(actions);
        actions['needleL'].setDuration(6).play();
        arrow.morphTargetInfluences[0] = 0;
        arrow.morphTargetInfluences[1] = 0;
        arrow.morphTargetInfluences[2] = 1;
        arrow.morphTargetInfluences[3] = 0;
        galvRot = 0;
        galvL = 0.6;
        galvR = -0.6;
        changeFlux = true;
        message = "CHANGING CURRENT (FLUX) DEFLECTS THE GALVANOMETER TO LEFT";
        messageEl.textContent = message;
        galvRotLeft();
        setTimeout(function(){ 
            
            changeFlux = false;
            galvRotStop();
        }, 5000);
        // galvRotRight();
        animate();    
    } else if (flip  && !hold ) {
        console.log('SWITCH ON')
        arrow.visible = true;
        console.log(actions);
        actions['needleL'].setDuration(6).play();
        arrow.morphTargetInfluences[0] = 0;
        arrow.morphTargetInfluences[1] = 1;
        arrow.morphTargetInfluences[2] = 0;
        arrow.morphTargetInfluences[3] = 1;
        galvRot = 0;
        galvL = 0.6;
        galvR = -0.6;
        changeFlux = true;
        message = "CHANGING CURRENT (FLUX) DEFLECTS THE GALVANOMETER TO RIGHT";
        messageEl.textContent = message;
        galvRotRight();
        setTimeout(function(){ 
            
            changeFlux = false;
            galvRotStop();
        }, 5000);
        animate();    
    }  
}

//Galvanometer and current arrow restored to initial state
function galvRotStop() {
    if (!hold  && !changeFlux) {
        arrow.morphTargetInfluences[0] = 1;
        arrow.morphTargetInfluences[1] = 0;
        arrow.morphTargetInfluences[2] = 0;
        arrow.morphTargetInfluences[3] = 0;
        actions['needleL'].reset().stop();
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        message = "NO CURRENT FLOWS THROUGH THE SOLENOID.... NO INDUCED CURRENT";
        messageEl.textContent = message;
    }
}

//Galvanometer deflects left
function galvRotLeft() {
    if (galvRot <= galvL ) {
        requestCurrent = requestAnimationFrame(galvRotLeft);
        galvRot += 0.003;
        galvNeedle.rotation.y += 0.003;
        render();
    } else if (galvL >= 0 ){
        requestCurrent = requestAnimationFrame(galvRotLeft);
        galvL += -0.003;
        galvNeedle.rotation.y += -0.003;
        render();
    } else if ( galvL > 0 ) {
        
        cancelAnimationFrame(requestCurrent);
    } 
}

//Galvanometer deflects right
function galvRotRight() {
    if (galvRot >= galvR ) {
        requestCurrent = requestAnimationFrame(galvRotRight);
        galvRot += -0.003;
        galvNeedle.rotation.y += -0.003;
        render();
    } else if (galvR <= 0 ){
        requestCurrent = requestAnimationFrame(galvRotRight);
        galvR += 0.003;
        galvNeedle.rotation.y += 0.003;
        render();
    } else if ( galvR < 0 ) {
        
        cancelAnimationFrame(requestCurrent);
        
    } 
}

//Move barmagnet and the induction solenoid relative to each other
function relativeMove() {
    if  (magZ >= -5 && magZ <=-2 ){
        requestID = requestAnimationFrame( relativeMove);        
        inducedSolenoid.position.z += magdz;
        galvanometer.position.z += magdz;
        galvNeedle.position.z += magdz;
        barMagnet.position.z += magdz;
        // console.log( solenoidModel);
        magZ += magdz
        message = "No relative change in the magnetic fields associated with the solenoid coil, needle doesn't deflect";
        messageEl.textContent = message;
        // console.log("moveleft")
        render();
    } else if ( inducedSolenoid.position.z > 0) {
        requestID = requestAnimationFrame( relativeMove);
        inducedSolenoid.position.z += -magdz;
        galvanometer.position.z += -magdz;
        galvNeedle.position.z += -magdz;
        barMagnet.position.z += -magdz;
        message = "No relative change in the magnetic fields associated with the solenoid coil, needle doesn't deflect";
        messageEl.textContent = message;
        // console.log( inducedSolenoid.position.z)
        render();
    }
    
}

//Move barmaget inside the solenoid, galvanometer deflects
function magnetMove() { 

    if  (magZ >= -5 && magZ <= 0 && moveL && !mRotate  && !stop) {
        //console.log( "go forward N-S", mRotate);
        buttonAction.innerHTML = "\&\#x2190\;";
        message = "Magnet moves towards the solenoid coil, the  Galvanometer needle deflects counterclockwise";
        messageEl.textContent = message;
        requestID = requestAnimationFrame( magnetMove);
        i = i+1;
        barMagnet.position.z += magdz;
        magZ += magdz; 
        galvNeedle.rotation.set( 0, needleY + speed*i , 0 );  
        
    } else if (magZ >= -5 && magZ <= 0 && moveL  && mRotate && !stop ) {
        //console.log( "go forward S-N", mRotate);
        buttonAction.innerHTML = "\&\#x2190\;";
        message = "Magnet moves towards the solenoid coil, the Galvanometer needle deflects clockwise";
        messageEl.textContent = message;
        requestID = requestAnimationFrame( magnetMove);
        i = i+1;
        barMagnet.position.z += magdz;
        magZ += magdz; 
        galvNeedle.rotation.set( 0, -(needleY + speed*i) , 0 );  

    } else if  (magZ > 0 && moveL && !stop ) {
        //console.log( "go reverse", magZ);
        requestID = requestAnimationFrame( magnetMove);
        magZ += -magdz;
        moveL = false;
        buttonAction.innerHTML = "\&\#x2192\;";
        
    } else if  (magZ >= -5 && magZ <= 0 && !moveL && !mRotate  && !stop ) {
        //console.log( "reversing N-S");
        buttonAction.innerHTML = "\&\#x2192\;";
        message = "Magnet moves away from the solenoid coil, the Galvanometer needle deflection decreases";
        messageEl.textContent = message;
        requestID = requestAnimationFrame( magnetMove);
        i = i-1;
        barMagnet.position.z += -magdz;
        magZ += -magdz; 
        galvNeedle.rotation.set( 0, needleY + speed*i , 0 );
    } else if (magZ >= -5 && magZ <= 0 && !moveL  && mRotate  && !stop) {
        //console.log( "reversing S-N");
        buttonAction.innerHTML = "\&\#x2192\;";
        message = "Magnet moves away from the solenoid coil, the Galvanometer needle deflection decreases";
        messageEl.textContent = message;
        requestID = requestAnimationFrame( magnetMove);
        i = i-1;
        barMagnet.position.z += -magdz;
        magZ += -magdz; 
        galvNeedle.rotation.set( 0, -(needleY + speed*i) , 0 );
        
    }else if (magZ < -5 && !moveL && !stop) {

        cancelAnimationFrame( requestID );
        message = "No change in magnetic fields results in no deflection of the Galvanometer needle";
        messageEl.textContent = message;
        buttonAction.innerHTML = "MOVE";
        buttonAction.style.backgroundColor = "rgb(3, 108, 156)";
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer'; 
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';       
        barMagnet.position.set( -0.5, 1.3, -4 );
        galvNeedle.rotation.set( 0, 0 , 0 );
        i = 0
        //console.log( "stop/reset");
    } 
    render(); 
}

// change barmagent polarity
function magnetRotate() {

    barMagnet.positionz = -5;
    if (!mRotate ) {
        barMagnet.rotation.y = -3.14;
        mRotate =true;
        magZ = magZ + magdz;
        message = "Magnet Polarity reversed, SOUTH pole points towards the solenoid coil";
        messageEl.textContent = message;
        // console.log( "1...S-N");
        render();
    } else {
        barMagnet.rotation.set( 0, 0, 0);
        mRotate = false;
        magZ = magZ + magdz;
        message = "Magnet Polarity restored, NORTH pole points towards the solenoid coil";
        messageEl.textContent = message;
        // console.log( "N-S");
        render();
    }
}

// change Electromagnet polarity
function magnetPolarity() {
    if (!flip) {
         electromagnet.rotation.set( 1.57, 0, 0 );
         flip = true;
         message = "ElectroMagnet Polarity Changed. Field directed RIGHT";
         messageEl.textContent = message ;
         rightHand.position.set( -0.9,0.5,1.2);
    } else if (flip) {
        electromagnet.rotation.set( 4.71, 0, 0 );
        flip = false;
        message = "ElectroMagnet Polarity Changed. Field directed LEFT";
        messageEl.textContent = message ;
        rightHand.position.set( -0.9,0.5,0.5 );
    } 
     animate(); 
}

//Button for barmagnet flip and current polarity change
buttonFlip.addEventListener('click', function () {
    if ( element === 0 ) { 
        // magnet polarity flip
        magnetRotate();

    } else if ( element === 1 ) { 
    //  current polarity flip 
        actions['polarity1'].reset();
        actions['polarity'].reset();
        arrow.visible = false;
        polarity();

    } else if ( element === 2 ) {
        magnetPolarity() 
    }
    
    
});

//Button for barmagnet motion to stop and current to hold
buttonStop.addEventListener('click', function () {
    stop = true;
    
    if (element === 0 && relative ) {
        cancelAnimationFrame( requestID );
        message = "Position of Solenoid and Magnet RESET";
        messageEl.textContent = message;
        inducedSolenoid.position.z = 0;
        galvanometer.position.z = 0;
        galvNeedle.position.z = 0;
        barMagnet.position.z = -4;
        galvNeedle.rotation.y = 0;
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';

    } else if(element === 0 && !relative) {
        message = "Galvanometer Needle and Magnet RESET";
        messageEl.textContent = message;
        buttonAction.innerHTML = 'MOVE';
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        inducedSolenoid.position.z = 0;
        barMagnet.position.z = -4;
        galvNeedle.rotation.y = 0; 

    } else if ( element === 1 && changeFlux ) {
       
        buttonAction.disabled = true;
        buttonAction.style.cursor = 'default';
        
        buttonFlip.disabled = true;
        buttonFlip.style.cursor = 'default';
        
        hold = true;
        actions['needleL'].paused = true;
        arrow. visible = true;
        changeFlux = false;
        message = "CONSTANT CURRENT FLOWS THROUGH THE SOLENOID.... NO INDUCED CURRENT";
        messageEl.textContent = message;
        
    } else if ( element === 1 && !changeFlux ) {
       
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        
        hold = false;
        message = "CHANGE CURRENT TO SEE THE EFFECT IN THE SOLENOID";
        messageEl.textContent = message;
    }  else if ( element === 2 && coilRotate ) {
       
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        cancelAnimationFrame( requestInduced );
        cancelAnimationFrame( requestInducedSlow );
        coilRotate = false;
        
        message = "ROD NOT ROTATING ( GREEN CYLINDER REPRESENTS THE INSULATION BETWEEN RINGS AND THE ROD )";
        messageEl.textContent = message;
        galvNeedle.rotation.y = 0;    
        visualClues(); 
    } else if ( element === 2 && coilRotateSlow ) {
       
        buttonAction.disabled = false;
        buttonAction.style.cursor = 'pointer';
        
        buttonFlip.disabled = false;
        buttonFlip.style.cursor = 'pointer';
        cancelAnimationFrame( requestInduced );
        cancelAnimationFrame( requestInducedSlow );
        coilRotateSlow = false;
        message = "ROD NOT ROTATING ( GREEN CYLINDER REPRESENTS THE INSULATION BETWEEN RINGS AND THE ROD )";
        messageEl.textContent = message;
        galvNeedle.rotation.y = 0;
        visualClues();    
    }
        
    render();
});

//load appropriate model on button click
function magmodelLoad() {
    if (element === 0) {
        // console.log('SOLENOID COIL');
        scene.add(inducedSolenoid);
        scene.add(barMagnet);
        scene.remove(coilModel); 
        scene.remove(rightHand);
        scene.remove(powerKnob, powerSupply, connector, solenoid, arrow);     
        render();
    } else if (element === 1) {
        // console.log('SOLENOID SOLENOID');
        
        scene.add(inducedSolenoid);
        scene.remove(barMagnet);
        scene.add(powerKnob, powerSupply, connector, solenoid, arrow);
        arrow.visible = false;
        scene.remove(rightHand);
        scene.remove(coilModel);
        render(); 
    } else if (element === 2) {
        // console.log('Armature Coil');
        scene.add(coilModel);
        scene.remove(inducedSolenoid);
        scene.remove(barMagnet);
        scene.remove(powerKnob, powerSupply, connector, solenoid, arrow);
        currentwire.morphTargetInfluences[1]= 1;
        coilStand.morphTargetInfluences[0]= 1;
        commutator.morphTargetInfluences[0]= 1;
        rings.morphTargetInfluences[0]= 0;
        coil.morphTargetInfluences[0]= 1;
        galvanometer.morphTargetInfluences[0]= 1;
        insulator.morphTargetInfluences[0]= 1;
        magnetwire.scale.set(1,1,1);
        render();
    }
}

buttonRule.addEventListener('click', function () {
    ruleClues = false;
    if (!ruleClues && !stop) {
        ruleviewer.style.visibility = "visible";
        visualClues();
        scene.add(rightHand);
    } else if (!ruleClues && stop) {
        ruleviewer.style.visibility = "visible";
        visualClues();
        scene.add(rightHand);
    }
   
    
});

//
closeRule.addEventListener('click', function() {
    ruleClues = true;
    ruleviewer.style.visibility = "hidden";
    scene.remove(rightHand);
   
});

//camera position
function setCamera() {
    
    if (element === 0) {
        fov = 40;
        aspect = width / height
        camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        camera.position.set(5, 5, 5);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(0, 0, -2);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.1;
        controls.update();
        
        
    } else if (element === 1) {
        fov = 30;
        aspect = width / height
        camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        camera.position.set(5, 5.5, 5);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(2, 1, -1.5);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.1;
        controls.update();
        
    } else if (element === 2) {
        fov = 20;
        aspect = width / height
        camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        camera.position.set(5, 5, 5);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.target.set(0, .5, -.2);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.1;
        controls.update();
        
    } 
    render();
}


init();

render();
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
    camera.position.set(5, 5, 5);
    
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
    controls.target.set(0, 0, -2);
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
            solenoidModel = gltf.scene;
            mixer = new THREE.AnimationMixer(gltf.scene);
            powerKnob = solenoidModel.children[0];
            powerSupply = solenoidModel.getObjectByName('Supply');
            // console.log(mixer);
            arrow = solenoidModel.getObjectByName('arrow');
            solenoid = solenoidModel.getObjectByName('solenoid');
            connector = solenoidModel.getObjectByName('connector');
            barMagnet = solenoidModel.getObjectByName('barMagnet');
            galvNeedle = solenoidModel.getObjectByName('galvNeedle');
            galvanometer = solenoidModel.getObjectByName('Galvanometer');
            inducedSolenoid = solenoidModel.getObjectByName('induceSolenoid');
            inducedSolenoid.position.z = 0;
            // galvNeedle.position.set(1.04, 0.1, 0);
            // galvNeedle.rotation.set(0, 0, 0);
            scene.add( inducedSolenoid, barMagnet, galvanometer, galvNeedle );
            // scene.add(powerKnob, powerSupply, connector, solenoid, arrow);
            // arrow.visible = false;
            renderer.render( scene, camera );
        
            let fixedStates = ['needleL', 'polarity', 'polarity1' ];
            for (let i = 0; i < gltf.animations.length; i++) {
                
                let clip = gltf.animations[i];
                let action = mixer.clipAction(clip);
                actions[clip.name] = action;
                console.log(clip.name, clip.duration);

                if (fixedStates.indexOf(clip.name) >= 0) {
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                    //console.log(i, clip.name, fixedStates.indexOf(clip.name) )
                }
            }
    });   
    //load Right Hand gesture
    loader
        .setPath(modelPath)
        .load(elements['2'], function (gltf) {
            rightHand = gltf.scene;
            gltf.scene.traverse((child) => {
                if (child.type == 'SkinnedMesh') {
                    child.frustumCulled = false;
                }
            });
           
        });

//load Armature Coil model
    loader
        .setPath(modelPath)
        .load(elements['3'], function (gltf) {
            coilModel = gltf.scene;
            mixer1 = new THREE.AnimationMixer(coilModel);
            coilStand = gltf.scene.getObjectByName('coil');
            coil = gltf.scene.getObjectByName('CoilStand');
            commutator = gltf.scene.getObjectByName('Commutator');
            rings = gltf.scene.getObjectByName('Rings');
            insulator = gltf.scene.getObjectByName('Insulator');
            magnetwire = gltf.scene.getObjectByName('MagnetWire');
            currentwire = gltf.scene.getObjectByName('currentwire');
            electromagnet = gltf.scene.getObjectByName('Magnet');
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
                let action = mixer1.clipAction(clip);
                actions[clip.name] = action;
                if (fixedStates.indexOf(clip.name) >= 0) {
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                    //console.log(i, clip.name, fixedStates.indexOf(clip.name) )
                }

            }
            
        });    
	window.addEventListener( 'resize', onWindowResize );

}
 

function onWindowResize() {
    aspect = window.innerWidth / window.innerHeight;

	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}
 
function render() {

	renderer.render( scene, camera );

}


function animate() {
    requestAnimationFrame( animate );
    const delta = clock.getDelta();
    mixer.update(delta);
    mixer1.update(delta);
    // mixer2.update(delta);
    controls.update();
    
    stats.update();
    render();
    
}











        