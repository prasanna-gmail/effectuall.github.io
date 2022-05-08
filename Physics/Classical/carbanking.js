import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../../jsm/renderers/CSS2DRenderer.js';
import  Stats  from '../../jsm/libs/stats.module.js';
import { GUI } from '../../jsm/libs/lil-gui.module.min.js';

let scene, camera, gui, controls, stats, clock, renderer, labelRenderer;
let model, mixer, car, scaleHorizontal, road, refPoint, curvePoint, carMaterial;
let move = true,  curve = false;
let modelReady = false;
let actions= [];
let activeAction, previousAction;
// let carMoving, carBanking;
let activeVector, previousVector;
let group = new THREE.Group();
let refgroup = new THREE.Group();
let curvegroup = new THREE.Group();
let Nx, Ny, Nylabel, Nxlabel;
let weight, Wlabel, velocity, force, label, Flabel, Vlabel, normal, Nlabel;

const animations = {
    Force:  true,
    Velocity: true,
    Banking: false,
    Weight: true,
    Normal: true,
    Opacity: 1,
    Components: function() {
        curve = !curve;
        atCurvature();
       
    },
    slow: 1

   
}
// let buttonEqn = document.getElementById('eqn-el');
let messageEl = document.getElementById('message-el');
// let footermenu = document.getElementById('footermenu');

function init() {

    let container;
    container = document.getElementById('container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set( 38, 10, -25 ) ;
    // camera.rotation.set( 0,-3, 0);
   
    scene.add(camera);

    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 1, 1);
    
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(- 1, - 1, 1);
    
    scene.add(light2);


    stats = new Stats();
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
    controls.enablePan = true;
    controls.enableZoom = true;
    
    controls.target.set(-100, 2, 45);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
    controls.minDistance = .1;
    controls.maxDistance = 5000;
    
    scaleHorizontal =new THREE.GridHelper(70, 70);
    
    scene.add( scaleHorizontal);
    
    window.addEventListener('resize', onWindowResize);

    // buttonEqn.addEventListener('click', function () {
     
    // });

}

function createModel () {
    const loader = new GLTFLoader();
    loader
    .setPath('../model/')
    .load('Banking.glb', function(gltf) {
        model = gltf.scene;
        
        car = model.getObjectByName( 'car' );
        carMaterial = car.material;
        weight = model.getObjectByName( 'weight' );
        velocity = model.getObjectByName( 'velocity' );
        normal = model.getObjectByName( 'normal' );
        force = model.getObjectByName( 'force' );
        Flabel = model.getObjectByName( 'Flabel' );
        Nx = model.getObjectByName( 'nx' );
        Nxlabel = model.getObjectByName( 'Nxlabel' );
        Ny = model.getObjectByName( 'ny' );
        road = model.getObjectByName( 'road' );
        refPoint = model.getObjectByName( 'refPoint' );
        curvePoint = model.getObjectByName( 'curvePoint' );
        
        modelReady = true;
        
        // model.scale.set(20,20,20);
        road.morphTargetInfluences[0] = 0;
        scene.add( model);
        console.log(car)
        mixer = new THREE.AnimationMixer(model);
       
        for (let i = 0; i < gltf.animations.length; i++) {

            let clip = gltf.animations[i];
            let action = mixer.clipAction(clip);
            // console.log(action);
            actions[clip.name] = action;
            
        }
        console.log(actions);
		
        activeAction = actions['nobankMoving'];
        activeVector = actions['nxAction'];
        actions['nobankMoving'].play();
        actions['refAction'].play();
        actions['nocurveAction'].play();
        actions['nxAction'].play();
        actions['NxlabelAction'].play();
        actions['forceAction'].play();
        actions['FlabelAction'].play();
        gltf.scene.traverse((child) => {
            if ( child.type == 'SkinnedMesh' ) {
              child.frustumCulled = false;
            }
        });
        Nx.visible = false;
        Nxlabel.visible = false;
        Ny.visible = false;
        
        
        Vlabel = addLabels( "Velocity,'V'" );
        Vlabel.position.z = -8;
        refPoint.add(Vlabel);
        Wlabel = addLabels( "Weight,'W'" );
        Wlabel.position.y = -8;
        refPoint.add(Wlabel);
        Nlabel = addLabels( "Normal, 'N'" );
        Nlabel.position.y = 8;
        refPoint.add(Nlabel);
        Nylabel = addLabels( "Ny" );
        Nylabel.position.y = 5;
        refPoint.add(Nylabel);
        Nylabel.visible = false;
    }); 
    
    
}


window.onload = function() {
    init();
    animate();
    createModel();
    guiControls();
    
   
    scene.add(new THREE.AmbientLight(0xffffff));
    
}

function animate() {   
    requestAnimationFrame( animate );
    const delta = clock.getDelta();

    // mixer.update(delta);
    if (modelReady) mixer.update(delta);
    controls.update();

    // stats.update();

	render();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    render();

}

function render() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function guiControls() {
    gui = new GUI();
    // camera control adjust
    // let controlFolder = gui.addFolder("Control");
    // controlFolder.add(controls.target, 'x', -100, 100);
    // controlFolder.add(controls.target, 'y', -100, 100);
    // controlFolder.add(controls.target, 'z', -100, 100);
    // let cameraFolder = gui.addFolder("Camera");
    // cameraFolder.add(camera.position, 'x', -100, 100);
    // cameraFolder.add(camera.position, 'y', -100, 100);
    // cameraFolder.add(camera.position, 'z', -100, 100);
    let animationsFolder = gui.addFolder('Animations');
    
    // animationsFolder.add(animations, 'Pause'). name('Pause/Continue');
    animationsFolder.add(animations, 'slow', 0.0, 1.5, 0.005 ). name('Modify time'). onChange( slowMotion );
    
    let indicatorFolder = gui.addFolder('Vectors');
    // Add vectors
    indicatorFolder.add(animations, 'Force').onChange(() => {
        
        showHide(animations.Force, force, Flabel)
     });;
    indicatorFolder.add(animations, 'Velocity') .onChange(() => {
       
        showHide(animations.Velocity, velocity, Vlabel)
     });
    
     indicatorFolder.add(animations, 'Normal') .onChange(() => {
        showHide(animations.Normal, normal, Nlabel)
     });
     
     indicatorFolder.add(animations, 'Weight') .onChange(() => {
        // new THREE.Vector3( 1, 0, 0 )
        showHide(animations.Weight, weight, Wlabel)
       
     });
     //  Add Banking Reference
    indicatorFolder.add(animations, 'Banking') .name('Set Banking to the road').onChange(() => {
       
        addBanking();
        // 
     });
     indicatorFolder.add(animations, 'Opacity', 0.0, 1, 0.005) .onChange((value) => {
        // new THREE.Vector3( 1, 0, 0 )
        carOpacity(value);
       
     });
     let bankingFolder = gui.addFolder('Solving Reference');    
     
     bankingFolder.add(animations, 'Components') . name('Pause/Continue at curvature');
    
    
}

function pauseContinue() {
    if (move) {
      
        actions['bankMoving'].paused = true;
        actions['nobankMoving'].paused = true;
        actions['refAction'].paused = true;
        actions['nocurveAction'].paused = true;
        actions['curveAction'].paused = true;
        actions['nxAction'].paused = true;
        actions['forceAction'].paused = true;
        actions['FlabelAction'].paused = true;
        actions['NxlabelAction'].paused = true;

        move = false;
    }else {
        actions['bankMoving'].paused = false;
        actions['nobankMoving'].paused = false;
        actions['refAction'].paused = false;
        actions['nocurveAction'].paused = false;
        actions['curveAction'].paused = false;
        actions['nxAction'].paused = false;
        actions['forceAction'].paused = false;
        actions['FlabelAction'].paused = false;
        actions['NxlabelAction'].paused = false;
        move = true;
    }
    
}

function slowMotion( speed ) {
    
    mixer.timeScale = speed;
       
}

function addBanking() {
    if (animations.Banking) {
        slowMotion( 1 )
        carOpacity( 1 )
        setTimeout(function () {
            for (let i = 0; i <= 0.55; i = i + 0.0005) {
                road.morphTargetInfluences[0] = i;
                messageEl.innerText = 'Car moving over a Banked Road';
            }
            resetAction();
            
            fadeToAction('bankMoving', .01);
            fadeToVector('curveAction', .01);
            Nx.visible = true;
            Nxlabel.visible = true;
            Ny.visible = true;
            Nylabel.visible = true;
        }, 500);
       
    } else  {
        slowMotion( 1 )
        carOpacity( 1)
        setTimeout(function () {
            for (let i = 0.55; i >= 0; i = i - 0.0005) {
                road.morphTargetInfluences[0] = i;
                messageEl.innerText = 'Car moving over a Parallel Road';
            }
            resetAction();
            Nx.visible = false;
            Nxlabel.visible = false;
            Ny.visible = false;
            Nylabel.visible = false;
            fadeToAction('nobankMoving', .01);
            fadeToVector('nocurveAction', .01);
            // resetAction('forceAction');
            // resetAction('nxAction');
            // resetAction('refAction');
        }, 500);
    } 
    
}

function fadeToAction( name, duration ) {

    previousAction = activeAction;
    activeAction = actions[ name ];
    console.log(actions[ name ])
    if ( previousAction !== activeAction ) {

        previousAction.fadeOut( duration );

    }

    activeAction
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .fadeIn( duration )
        .play();

}

function fadeToVector( name, duration ) {

    previousVector = activeVector;
    activeVector = actions[ name ];
    console.log(actions[ name ])
    if ( previousVector !== activeVector ) {

        previousVector.fadeOut( duration );

    }

    activeVector
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .fadeIn( duration )
        .play();

}

function resetAction(name) {
    // actions[name].reset();
    actions['bankMoving'].reset();
    actions['nobankMoving'].reset();
    actions['refAction'].reset();
    actions['nocurveAction'].reset();
    actions['curveAction'].reset();
    actions['nxAction'].reset();
    actions['forceAction'].reset();
    actions['FlabelAction'].reset();
    actions['NxlabelAction'].reset();
}

function atCurvature() {
    if (curve) {
        slowMotion( 0 )
        
        carOpacity(0.3) 
        // curve = false;
    } else {
        slowMotion( 1 )
        carOpacity(1) 
        // curve = true;
    }
       
}

function carOpacity(value) {
    carMaterial.opacity = value;
    carMaterial.transparent = true;
    carMaterial.format = THREE.RGBAFormat
}
function addLabels( name ) {
    
    let text = document.createElement('div');
    text.className = 'label';
    text.textContent =  name ;
    
    label= new CSS2DObject(text);
    return label

}


function showHide(Action, vector, label) {
    if (Action) {
        
        let Vector = vector;
        let Label = label;
       
        Vector.visible = true;
        Label.visible = true;
    } else {
        let Vector = vector;
        let Label = label;
        Vector.visible = false;
        Label.visible = false;
    }
}