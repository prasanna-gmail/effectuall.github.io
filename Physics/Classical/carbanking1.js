import * as THREE from '../build/three.module.js';
import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../jsm/renderers/CSS2DRenderer.js';
import  Stats  from '../jsm/libs/stats.module.js';
import { GUI } from '../jsm/libs/lil-gui.module.min.js';

let scene, camera, gui, controls, stats, clock, renderer, labelRenderer;
let model, mixer, car, scaleHorizontal, road, refPoint, curvePoint;
let move = true, bank = false, curve = false;
let modelReady = false;
let actions, activeAction, previousAction;
// let carMoving, carBanking;
let banked, bankMoving, nobankMoving, refMove, Unbanked;
let group = new THREE.Group();
let Wgroup = new THREE.Group();
let Bgroup = new THREE.Group();
let Nylabel, Nxlabel;
let weight, Wlabel, Wbank, Wblabel, velocity, fvectors, force, label, Ftext, Flabel, Vlabel, normal, Nlabel;
let dir = new THREE.Vector3(0,0,1); 
const animations = {
    Force:  false,
    Velocity: false,
    Banking: false,
    Weight: false,
    Normal: false,
    Components: function() {
        curve = !curve;
        atCurvature();
       
    },
    Pause: function() {
        pauseContinue();
        console.log('pause');
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

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set( 40, 9, 1.6 ) ;
    camera.rotation.set( -0.52, 0, 0);
   
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
    
    controls.target.set(16, 5, -5);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
    controls.minDistance = .1;
    controls.maxDistance = 5000;
    
    scaleHorizontal =new THREE.GridHelper(60, 60);
    
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
        // refPlane = model.getObjectByName( 'refPlane' );
        // bankPlane = model.getObjectByName( 'bankPlane' );
        // ground = model.getObjectByName( 'ground' );
        road = model.getObjectByName( 'road' );
        refPoint = model.getObjectByName( 'refPoint' );
        curvePoint = model.getObjectByName( 'curvePoint' );
        model.scale.set(20,20,20);
        road.morphTargetInfluences[0] = 0;
        scene.add( model);
        // refPlane.visible = false;
        // bankPlane.visible = false;
        modelReady = true;
        
        mixer = new THREE.AnimationMixer(model);
        
        const animations = gltf.animations;

		mixer = new THREE.AnimationMixer( model );
       
		banked = mixer.clipAction( animations[ 0 ] );
		bankMoving = mixer.clipAction( animations[ 1 ] );
        nobankMoving = mixer.clipAction( animations[ 2 ] );
        
        
        Unbanked = mixer.clipAction( animations[ 3 ] );
        refMove = mixer.clipAction( animations[ 4 ] );
		actions = [banked, bankMoving, nobankMoving, refMove, Unbanked ];
        activeAction = actions[2];
        actions[2].play();
        actions[3].play();
        gltf.scene.traverse((child) => {
            if ( child.type == 'SkinnedMesh' ) {
              child.frustumCulled = false;
            }
        });
       
       
    }); 
    if (modelReady) {
        showWreflabel(new THREE.Vector3( 0, -1, 0 ), 'W (Weight)', 0xff2FF4);      
        showWlabel(new THREE.Vector3( 0, -1, 0 ), 'W (Weight)', 0xff2FF4);
    
    }
    
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
    
    animationsFolder.add(animations, 'Pause'). name('Pause/Continue');
    animationsFolder.add(animations, 'slow', 0.0, 1.5, 0.005 ).onChange( slowMotion ). name('Modify time');
    let indicatorFolder = gui.addFolder('Vectors');
    // Add vectors
    indicatorFolder.add(animations, 'Force').onChange(() => {
        
        showFlabel( dir, 'F(Force)', 0xFF0000);
     });;
    indicatorFolder.add(animations, 'Velocity') .onChange(() => {
       
        showVlabel(new THREE.Vector3( 0, 0, -1 ), 'V(Velocity)', 0xA020F0);
     });
    
     indicatorFolder.add(animations, 'Normal') .onChange(() => {
        showNlabel(new THREE.Vector3( -1, 0, 0 ), 'N(Normal)', 0x00FFFF);
     });
     
     indicatorFolder.add(animations, 'Weight') .onChange(() => {
        // new THREE.Vector3( 1, 0, 0 )
       showWeight();
       
     });
     //  Add Banking Reference
    indicatorFolder.add(animations, 'Banking') .name('Set Banking to the road').onChange(() => {
       
        addBankingplane();
        // 
     });
     let bankingFolder = gui.addFolder('Solving Reference');    
     
     bankingFolder.add(animations, 'Components') . name('Stop Car at the curvature');
    
    
}

function pauseContinue() {
    if (move) {
        actions[3].paused = true;
        actions[2].paused = true;
        actions[1].paused = true;
        move = false;
    }else {
        actions[3].paused =false;
        actions[2].paused =false;
        actions[1].paused =false;
        move = true;
    }
    
}

function slowMotion( speed ) {
    
    mixer.timeScale = speed;
    
}

function addLabels(pos, name, col) {
       
        fvectors = new THREE.ArrowHelper( pos, new THREE.Vector3(0, 0, 0), 1, col);
        fvectors.scale.set(0.5,0.5,0.5);
        
        Ftext = document.createElement('div');
        Ftext.className = 'label';
        Ftext.textContent =  name ;
        label= new CSS2DObject(Ftext);
        return {fvectors, label}
    
}

function showFlabel(pos, name, col) {
    if (animations.Force) {
        addLabels(pos, name, col) 
        force = fvectors;
        Flabel = label;
        Wgroup.add(force);
        refPoint.add(Wgroup);
        dir.applyAxisAngle( new THREE.Vector3(1,0,0), 3.14);
        force.setDirection(dir);
        console.log(refPoint.position.x, force);
        force.cone.add(Flabel);
        Flabel.visible = true;
        force.visible = true;
        
    } else {
        Flabel.visible = false;
        force.visible = false;
    }
}

function showVlabel(pos, name, col) {
    if (animations.Velocity) {
        addLabels(pos, name, col) 
        velocity = fvectors;
        Vlabel = label;
        group.add(velocity);
        car.add(group);
        velocity.cone.add(Vlabel);
        Vlabel.visible = true;
        velocity.visible = true;
    } else {
        Vlabel.visible = false;
        velocity.visible = false;
    }
}

function showNlabel(pos, name, col) {
    if (animations.Normal) {
        addLabels(pos, name, col) 
        normal = fvectors;
        Nlabel = label;
        group.add(normal);
        car.add(group);
        normal.cone.add(Nlabel);
        Nlabel.visible = true;
        normal.visible = true;
    } else {
        Nlabel.visible = false;
        normal.visible = false;
    }
}



function addBankingplane() {
    if (!curve && animations.Banking) {
        fadeToAction(1, .01);
        actions[1].play();
        actions[3].reset();
        setTimeout(function () {
            for (let i = 0; i <= 1; i = i + 0.0005) {
                road.morphTargetInfluences[0] = i;
                bank = true;
                messageEl.innerText = 'Car moving over a Banked Road';
            }

        }, 500);
    } else if (!curve && !animations.Banking) {
        fadeToAction(2, .01);
        actions[2].play();
        actions[3].reset();
        setTimeout(function () {
            for (let i = 1; i >= 0; i = i - 0.0005) {
                road.morphTargetInfluences[0] = i;
                bank = false;
                messageEl.innerText = 'Car moving over a parallel road';
            }
        }, 500);
    }  else if (curve && animations.Banking) {
        
        setTimeout(function () {
            for (let i = 0; i <= 1; i = i + 0.0005) {
                road.morphTargetInfluences[0] = i;
                bank = true;
                messageEl.innerText = 'Car on a Banked Road';
            }
            fadeToAction( 0, 0.5 );
            actions[0].play();
        }, 500);
    } else if (curve && !animations.Banking) {
        
        setTimeout(function () {
            for (let i = 1; i >= 0; i = i - 0.0005) {
                road.morphTargetInfluences[0] = i;
                bank = false;
                messageEl.innerText = 'Car on a parallel road';
            }
        }, 500);
        fadeToAction( 4, 0.5 );
        actions[4].play();
    }
    showWeight()
}

function fadeToAction( num, duration ) {

    previousAction = activeAction;
    activeAction = actions[ num ];

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

function showComplabel() {
    
    if (animations.Components ) {
        
        let Nx = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 0.25, 0xFFFFFF);
        let Ny = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0),  0.5, 0xFFFFFF);
        // Nx.scale.set(0.5,0.5,0.5);
        Ftext = document.createElement('div');
        Ftext.className = 'label';
        Ftext.textContent =  'Nx' ;
        Nxlabel= new CSS2DObject(Ftext);
        Ftext = document.createElement('div');
        Ftext.className = 'label';
        Ftext.textContent =  'Ny' ;
        Nylabel= new CSS2DObject(Ftext);
        refPoint.add(Nx);
        refPoint.add(Ny);
        Nx.cone.add(Nxlabel);
        Ny.cone.add(Nylabel);
        Nxlabel.visible = true;
        Nylabel.visible = true;
        Nx.visible = true;
        Ny.visible = true;
    } else {
        Nxlabel.visible = false;
        Nylabel.visible = false;
        Nx.visible = false;
        Ny.visible = false;
    }
}

function showWlabel( pos, name, col) {
    addLabels(pos, name, col) 
    weight = fvectors;
    Wlabel= label;
    
    Wgroup.add(weight);
    refPoint.add(Wgroup);
    weight.cone.add(Wlabel); 
    showWeight()   
    // if (animations.Weight ) {
    //     Wgroup.visible = true;
    //     Wlabel.visible = true;
    //     // weight.visible = true;
    //     console.log('show weight')
    // }   else {
       
    //     Wlabel.visible = false;
    //     // weight.visible = false;
    //     Wgroup.visible = false;
    //     console.log('hide weight', Wgroup)
    //     // Wgroup.remove(weight);
    //     // car.remove(Wgroup);
    // }
}
function showWreflabel(pos, name, col) {
    addLabels(pos, name, col) 
    Wbank = fvectors;
    Wblabel= label;
   
    Bgroup.add(Wbank);
    
    Wbank.cone.add(Wblabel);
    console.log(curvePoint);
    curvePoint.add(Bgroup);
   
    showWeight()      
    // if (animations.Weight ) {
    //     Wblabel.visible = true;
    //     Wbank.visible = true;
    // }   else {
       
    //     Wblabel.visible = false;
    //     Wbank.visible = false;
    // }
}

function atCurvature() {
    console.log(curve);
    if (curve && bank) {
        console.log('curvature on banked road');
        fadeToAction( 0, 0.1 );
        actions[0].play();
       
        // camera.position.set(7,6,-41.1);
        // camera.rotation.set(-1.50,.1,1.52);
        messageEl.innerText ='Lets set the free force diagram at the road curvature for Banked road';
        
     } else if (curve && !bank) {
        console.log('curvature on Unbanked road');
        messageEl.innerText ='Lets set the free force diagram at the road curvature for Unbanked road ';
        fadeToAction( 4, 0.1 );
        actions[4].play();
        
        
        // camera.position.set(-15,11,-48);
     } else if (!curve && bank) {
        console.log('move on banked road');
        fadeToAction( 1, 0.1 );
        actions[1].play();
        actions[3].reset();
        // camera.position.set(7,6,-41.1);
        // camera.rotation.set(-1.50,.1,1.52);
        messageEl.innerText ='car moving on banked road';
        
     } else if (!curve && !bank) {
        console.log('move on Unbanked road');
        messageEl.innerText ='car moving on Unbanked road ';
        fadeToAction( 2, 0.1 );
        actions[2].play();
        actions[3].reset();
        
        // camera.position.set(-15,11,-48);
     } 
     showWeight()    
}

function showWeight(){
    if (!curve && animations.Weight) {
       
        Wgroup.visible = true;
        Wlabel.visible = true;
        weight.visible = true;
        Wblabel.visible = false;
        Wbank.visible = false;
        console.log('show weight while stop at curve not enabled')
    }   else if (!curve && !animations.Weight) {
        Wgroup.visible = false;
        Wlabel.visible = false;
        weight.visible = false;
        Wblabel.visible = false;
        Wbank.visible = false;    
        console.log('hide weight while stop at curve not enabled')
        
    } else if (curve && animations.Weight) {
        
       
        Wlabel.visible = false;
        weight.visible = false;
        Wgroup.visible = false;
        Wblabel.visible = true;
        Wbank.visible = true;
        console.log('show weight at curvature while stop at curve enabled')
    } else if (curve && !animations.Weight){
        Wlabel.visible = false;
        weight.visible = false;
        Wgroup.visible = false;
        Wblabel.visible = false;
        Wbank.visible = false;

        console.log('hide weight at curvature while stop at curve enabled')
           
         
    } 
}