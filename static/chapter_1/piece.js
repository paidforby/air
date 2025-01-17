if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, scene, renderer , tick = 0;
var h = $('#handle'),
    l = $('#container'),
    r = $('#controller'),
    w = $('body').width() - 18;
var olivia_sphere;
var olivia = {
        shape: undefined,
        light: undefined,
        pulse: undefined,
        pulse_inc: 0,
        level: 0,
        color: 0x99ceff,//0x00fff0,
        size: 1,
        height: 1
}

var adeymo = {
        shape: undefined,
        light: undefined,
        pulse: undefined,
        pulse_inc: 0,
        level: 0,
        color: 0xffff4d,
        size: 1,
        height: 1
}

var bar = [];
for(var i = 0; i < 8; i++){
    bar[i] = {
            shape: undefined,
            light: undefined,
            pulse: undefined,
            pulse_inc: 0,
            level: 0,
            color: randomColor({ luminosity: 'bright', hue: 'blue' }),
            size: 1,
            height: 1
    };
}

var cal = [];
for(var i = 0; i < 8; i++){
    cal[i] = {
            shape: undefined,
            light: undefined,
            pulse: undefined,
            pulse_inc: 0,
            level: 0,
            color: randomColor({ luminosity: 'dark', hue: 'yellow' }),
            size: 1,
            width: 1
    };
}

var starSystem, particleSystem;
var starCount = 1200;
var star = [];
var explode=0;
var pulse=0;
var particle_options, spawnerOptions;
var clock = new THREE.Clock(); //use Date.now() instead?
var gui = new dat.GUI( { width: 350, autoPlace: false } );

var pulse_options; 

var PI = Math.PI;
var W = l.width(), H = window.innerHeight;

var video = [], videoImage = [], videoImageContext = [], videoTexture = [];
var vids=0;
var screen = [];

var mixer, loader;

var object;

function init() {

    var container = document.getElementById( 'container' );
    var controller = document.getElementById('controller');

    camera = new THREE.PerspectiveCamera( 60, W/H, 1, 10000 );
    camera.position.z = 100;

    scene = new THREE.Scene();
    scene.add( new THREE.AmbientLight( 0x00020 ) );
    scene.fog = new THREE.FogExp2( 0x00000, 0.02 );

    /* IMPORT VIDEOS HERE
    */ // this could be functionalized further

    loadVideo("/static/media/cops.mp4", 0);
    scene.add(screen[0]);

    loadVideo("/static/media/partis.mp4", 1);
    scene.add(screen[1]);

    loadVideo("/static/media/falldown.mp4", 1);
    scene.add(screen[4]);

    videoControls(0);
    videoControls(1);
    videoControls(2);

    /* END IMPORT
    */

    /* CREATE MAIN POINT LIGHT
    */
    pulse_options = {
        pace: .01, 
        min: .0005,
        max: .005,
    };

    olivia.shape = new THREE.SphereGeometry( 1, 64, 16 );
    olivia.light = new THREE.PointLight( 0x00fff0, 10, 50 );
    olivia.light.add( new THREE.Mesh( olivia.shape, new THREE.MeshBasicMaterial( { color: olivia.color } ) ) );
    scene.add( olivia.light );

    olivia.pulse = new THREE.Mesh( olivia.shape.clone(), pulseMaterial(olivia.color) );
    olivia.pulse.position = olivia.shape.position;
    olivia.pulse.scale.multiplyScalar(36);
    scene.add( olivia.pulse );

    adeymo.shape = new THREE.SphereGeometry( 1, 64, 16 );
    adeymo.light = new THREE.PointLight( adeymo.color, 10, 50 );
    adeymo.light.add( new THREE.Mesh( adeymo.shape, new THREE.MeshBasicMaterial( { color: adeymo.color } ) ) );
    adeymo.light.visible = false;
    scene.add( adeymo.light );

    adeymo.pulse = new THREE.Mesh( adeymo.shape.clone(), pulseMaterial(adeymo.color) );
    adeymo.pulse.position = adeymo.shape.position;
    adeymo.pulse.scale.multiplyScalar(36);
    adeymo.pulse.visible = false;
    scene.add( adeymo.pulse );

    for(var i = 0 ; i < 8 ; i++){
        bar[i].shape = new THREE.SphereGeometry( 1, 64, 16 );
        bar[i].light = new THREE.PointLight( adeymo.color, 10, 50 );
        bar[i].light.add( new THREE.Mesh( adeymo.shape, new THREE.MeshBasicMaterial( { color: bar[i].color } ) ) );
        bar[i].light.position.x = 20*i-70;
        bar[i].light.position.y = 70;
        bar[i].light.position.z = 5;
        bar[i].light.visible = false;
        scene.add( bar[i].light );
    }

    for(var i = 0 ; i < 8 ; i++){
        cal[i].shape = new THREE.SphereGeometry( 1, 64, 16 );
        cal[i].light = new THREE.PointLight( 0xff0f00, 10, 50 );
        cal[i].light.add( new THREE.Mesh( adeymo.shape, new THREE.MeshBasicMaterial( { color: cal[i].color } ) ) );
        cal[i].light.position.x = -120;
        cal[i].light.position.y = 20*i-70;
        cal[i].light.visible = false;
        scene.add( cal[i].light );
    }

    /* END MAIN POINT LIGHT
    */ 

    /* CREATE STAR SYSTEM
    */
    THREE.TextureLoader.crossOrigin = '';
    
    var starShape = new THREE.SphereGeometry( 1, 64, 16 );

    for (var p = 0; p < starCount; p++){ 
        // create a star of random color
        var select = Math.floor(Math.random()*3);
        if (select === 0){
            var colors = randomColor({ luminosity: 'bright', hue: 'blue' });
        }
        else if (select === 1){
            var colors = randomColor({ luminosity: 'bright', hue: 'yellow' });
        }
        else {
            var colors = randomColor({ luminosity: 'light', hue: 'red' });
        }
        
        star[p] = new THREE.PointLight( colors, 10, 50 );
        star[p].add( new THREE.Mesh( starShape, new THREE.MeshBasicMaterial( { color: colors } ) ) );
        //star[p] = new THREE.Mesh( starShape, new THREE.MeshBasicMaterial( { color: colors, transparent: true, opacity: 0} ) );
        star[p].visible = false;

        var pX = Math.random() * 500 - 250; // pre-load random numbers
        var pY = Math.random() * 500 - 250; // see example in GPU particle system
        var pZ = Math.random() * 500 - 250;

        star[p].position.x = pX;
        star[p].position.y = pY;
        star[p].position.z = pZ;

        var radius = Math.sqrt(pX*pX + pY*pY + pZ*pZ)
        if(radius > 120 && radius < 250) 
            scene.add( star[p] );
    }
    /* END STAR SYSTEM
    */

    var f0 = gui.addFolder('pulsing')    
    gui.add( pulse_options, "pace", pulse_options.min, pulse_options.max ).listen();
    gui.add( olivia, "size", 0, 99 ).listen();
    gui.add( adeymo, "size", 0, 99 ).listen();


    /* CONFIG RENDERER
    */
    renderer = new THREE.WebGLRenderer( { antialias: false , preserveDrawingBuffer: true, alpha: true} );
    renderer.setSize( W, H );
    //renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    container.appendChild( renderer.domElement );
    /* END RENDERER
    */

    /* INTERACTIVE CONTROLS
    */ 
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    //console.log(controls);
    gui.domElement.id = 'gui';

    controller.appendChild(gui.domElement);

    /* END CONTROLS
    */

    // ADD LISTENERS
    // create fallbacks if no midi?
    window.addEventListener('keydown', handleKeyDown, false);
    //window.addEventListener('keyup', handleKeyUp, false);
    window.addEventListener( 'resize', onWindowResize, false );

    // RESIZE PANES
    // uses jquery
    var isDragging = false;

    h.mousedown(function(e){
        isDragging = true;
        e.preventDefault();
    });
    $(document).mouseup(function(){
        isDragging = false;
    }).mousemove(function(e){
        if(isDragging){
            l.css('width', e.pageX);
            r.css('width', w - e.pageX);
            camera.aspect = l.width() / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( l.width(), window.innerHeight );
        }
    });


}

/* piece specific functions
 */
function barFormation(control, object){
    if(control.pressed && object.height < 200){
        object.light.visible = true;
        object.height += pressLength(control)*.001; 
    }
    object.light.scale.y = ease(object.height, object.light.scale.y, .005 );
}

function barDecay(control, object){
    if(control.pressed){
        object.light.visible = true;
        object.level -= pressLength(control)*.001; 
        
    }
    object.light.position.y = ease(object.level, object.light.position.y, .005 );
}

function calendarFormation(control, object){
    if(control.pressed && object.width < 400){
        object.light.visible = true;
        object.width += pressLength(control)*.001; 
        
    }
    object.light.scale.x = ease(object.width, object.light.scale.x, .005 );
}

function calendarRecede(control, object){
    if(control.pressed && object.width > 1){
        object.light.visible = true;
        object.width -= pressLength(control)*.001; 
        
    }
    object.light.scale.x = ease(object.width, object.light.scale.x, .005 );
}
/* END piece specific functions 
*/

function animate() {

    requestAnimationFrame( animate );

    time = Date.now();

    render( time );

}
    
var breathe = true;
var barz = true;
var list = false;
knob.eht.value = 1;

function render( time ){

    //var delta = clock.getDelta() * spawnerOptions.timeScale;

    var p = Math.floor(Math.random() * starCount);
    star[p].visible = true;

    //lazy way of fadin in objects?
    if (scene.fog.density > .0002){
        scene.fog.density -= .0001;
    }

    // TODO: add range to ease func
    //var fog_range = .02;
    //fog_range = knob.eht.value*(.02-.0002)+.0002;
    scene.fog.density = ease(.0002, .02, knob.eht.value, scene.fog.density, .1)

    //fadeIn(star[p], 100, 1);

    // change screen numbering to match or switch to object?
    screenSwitch(pad.one, 0);
    screenSwitch(pad.two, 1);

    screenOpacity(knob.one, 0);
    screenOpacity(knob.two, 1);

    // fix: need ifs to allow dat gui fall back...

    /*if(knob.fve.turned){
        range = knob.fve.value*(pulse_options.max-pulse_options.min)+pulse_options.min;
    }*/
    var range = knob.fve.value;
    range = knob.fve.value*(pulse_options.max-pulse_options.min)+pulse_options.min;
    pulse_options.pace = ease(range, pulse_options.pace, .1);

    /*if(knob.six.turned){
    }*/
    olivia.size = ease(knob.six.value*100, olivia.size, .1)
    olivia.pulse.scale.x = olivia.size;
    olivia.pulse.scale.y = olivia.size;
    olivia.pulse.scale.z = olivia.size;

    adeymo.size = ease(knob.six.value*100, adeymo.size, .1)
    adeymo.pulse.scale.x = adeymo.size;
    adeymo.pulse.scale.y = adeymo.size;
    adeymo.pulse.scale.z = adeymo.size;

    pulseAnimation(olivia);
    pulseAnimation(adeymo);

    if(breathe){
        if(pad.fve.pressed){
            //particle_options.color = olivia.color;
            olivia.light.visible = !olivia.light.visible; 
            olivia.pulse.visible = !olivia.pulse.visible;
            adeymo.light.visible = !adeymo.light.visible; 
            adeymo.pulse.visible = !adeymo.pulse.visible;
            pad.fve..pressed = false; 
        }
        if(pad.six.pressed){    
            adeymo.light.visible = !adeymo.light.visible; 
            adeymo.pulse.visible = !adeymo.pulse.visible;
            pad.six.pressed = false; 
        }    

        if(octave1.F.pressed){
            olivia.light.visible = true;
            olivia.pulse.visible = true;
            olivia.level += pressLength(octave1.F)*.001; 
        }
        if(octave1.Fsh.pressed){
            olivia.level -= pressLength(octave1.Fsh)*.001; 
        }
        olivia.light.position.y = ease(olivia.level, olivia.light.position.y, .01 );
        olivia.pulse.position.y = olivia.light.position.y;
        olivia.pulse.lookAt(camera.position);

        if(octave1.G.pressed){
            adeymo.light.visible = true;
            adeymo.pulse.visible = true;
            adeymo.level += pressLength(octave1.G)*.001; 
        }
        if(octave1.Gsh.pressed){
            adeymo.level -= pressLength(octave1.Gsh)*.001; 
        }
        adeymo.light.position.y = ease(adeymo.level, adeymo.light.position.y, .01 );
        adeymo.pulse.position.y = adeymo.light.position.y;
        adeymo.pulse.lookAt(camera.position);

    }
    if(barz){

        barFormation(octave2.C, bar[0]);
        barFormation(octave2.D, bar[1]);
        barFormation(octave2.E, bar[2]);
        barFormation(octave2.F, bar[3]);
        barFormation(octave2.G, bar[4]);
        barFormation(octave2.A, bar[5]);
        barFormation(octave2.B, bar[6]);
        barFormation(octave3.C, bar[7]);

        calendarFormation(octave3.D, cal[0]);
        calendarFormation(octave3.E, cal[1]);
        calendarFormation(octave3.F, cal[2]);
        calendarFormation(octave3.G, cal[3]);
        calendarFormation(octave3.A, cal[4]);
        calendarFormation(octave3.B, cal[5]);
        calendarFormation(octave4.C, cal[6]);
        calendarFormation(octave4.D, cal[7]);

        if(pad.six.pressed){
            barz = false;
            list = true;
            pad.six.pressed = false;
        }
        

    }
    if(list){

        barDecay(octave2.C, bar[0]);
        barDecay(octave2.D, bar[1]);
        barDecay(octave2.E, bar[2]);
        barDecay(octave2.F, bar[3]);
        barDecay(octave2.G, bar[4]);
        barDecay(octave2.A, bar[5]);
        barDecay(octave2.B, bar[6]);
        barDecay(octave3.C, bar[7]);

        calendarRecede(octave3.D, cal[0]);
        calendarRecede(octave3.E, cal[1]);
        calendarRecede(octave3.F, cal[2]);
        calendarRecede(octave3.G, cal[3]);
        calendarRecede(octave3.A, cal[4]);
        calendarRecede(octave3.B, cal[5]);
        calendarRecede(octave4.C, cal[6]);
        calendarRecede(octave4.D, cal[7]);


    }

    /* UPDATE VIDEO 
    */ 
    for (var i = 0; i < video.length ; i++){
        if ( video[i].readyState === video[i].HAVE_ENOUGH_DATA ) 
        {
            videoImageContext[i].drawImage( video[i], 0, 0, videoImage[i].width, videoImage[i].height );
            if ( videoTexture[i] ) 
                videoTexture[i].needsUpdate = true;
        }
        if( video[i].readyState === video[i].HAVE_ENOUGH_DATA ){
          videoTexture[i].needsUpdate = true;
        }
    }
    /* END VIDEO UPDATE
    */

    renderer.render( scene, camera );

}

init();
animate();
