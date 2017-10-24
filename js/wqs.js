//Web Audio
try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
}
catch(e) {
  alert('Web Audio API is not supported in this browser');
}

var audio = new Audio();
audio.src = 'audio/warmth.mp3';
audio.controls = false;
audio.autoplay = true;
audio.loop = true;
document.body.appendChild(audio);

var analyser = context.createAnalyser();

window.addEventListener('load', function(e) {
  // Our <audio> element will be the audio source.
  var source = context.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(context.destination);

}, false);

//Array for bin values
analyser.fftSize = 32768; //half this = bin count
var FreqArray = new Float32Array(analyser.frequencyBinCount);

//THREEjs

var scene, renderer;
var meshes, group, waveform, frequency, duration;
var camera, cameraControls;

if( !init() )	animate();

// init the scene
function init(){

    renderer = new THREE.WebGLRenderer({
        antialias		: true,	// to get smoother output
        preserveDrawingBuffer	: true,	// to allow screenshot
        alpha: true, //for transparency
    });
    renderer.setClearColor( 0x000000, 0 );

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild(renderer.domElement);

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    var cameraH	= 24;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    camera	= new THREE.OrthographicCamera( -cameraW/2, +cameraW/2, cameraH/2, -cameraH/2, 1, 100 );
    camera.position.set(0, 10, 20);
    camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add(camera);

    var light	= new THREE.AmbientLight( 0x550000 );
    scene.add( light );

    var light	= new THREE.PointLight(0x885500, 2, 50, 0.6);
    light.position.set( 2, 10, 18 );
    scene.add( light );

    var light	= new THREE.DirectionalLight( 0x555500 );
    light.position.set( 20, -20, 10);
    light.target.position.set(0,0,0);
    scene.add( light );

    //Cylinders
    var geometry    = new THREE.CylinderGeometry( 5, 5, 0.2, 96 );
    var material	= new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent:true,
        opacity:0.98,
        blending:THREE.AdditiveBlending,
    });

    meshes = [];

    group = new THREE.Object3D();

    for (var i = 0; i < 6; i++) {
        var mesh	    = new THREE.Mesh( geometry, material );
        group.add( mesh );
        meshes[i] = mesh;
    }

    scene.add(group);

    group.rotation.z = 0.2;

    //Waveform lines
    var material = new THREE.LineBasicMaterial({
    	color: 0xff9955,
    });

    var geometry = new THREE.Geometry();
    for (var i = 0; i < 100; i++) {
        geometry.vertices.push(
        	new THREE.Vector3( 0, -5+i/10, 0 )
        );
    }

    waveform = new THREE.Line( geometry, material );
    waveform.position.x = 9;
    scene.add( waveform );

    //frequency lines
    var geometry = new THREE.Geometry();
    for (var i = 0; i < 100; i++) {
        geometry.vertices.push(
        	new THREE.Vector3( 0, -5+i/10, 0 )
        );
    }

    frequency = new THREE.Line( geometry, material );
    frequency.position.x = -9;
    scene.add( frequency );

    window.addEventListener( 'resize', onWindowResize );
    window.addEventListener( 'mousemove', onMouseMove );

    //grab grandient and make it the right size
    var gradient = document.getElementById("gradient");
    gradient.style.width = gradient.style.height = window.innerHeight * 2 + "px";
    gradient.height = window.innerHeight * 2;

}

function onWindowResize() {

    var cameraH	= 24;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    camera.left = -cameraW/2;
    camera.right = +cameraW/2;
    camera.top = cameraH/2;
    camera.bottom = -cameraH/2;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    //grab grandient and make it the right size
    var gradient = document.getElementById("gradient");
    gradient.style.width = gradient.style.height = window.innerHeight * 2 + "px";
    gradient.height = window.innerHeight * 2;

}

function onMouseMove(evt) {
    group.rotation.z += (0.6-0.4 * evt.clientX/window.innerWidth - group.rotation.z)/12;
    group.rotation.x += (-0.2+0.4 * evt.clientY/window.innerHeight - group.rotation.x)/12;
}

// animation loop
function animate() {

    // loop on request animation loop
    // - it has to be at the begining of the function
    // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    requestAnimationFrame( animate );

    //Store the waveform data
    analyser.getFloatTimeDomainData(FreqArray);

    //update waveform
    for (var i = 0; i < 100; i++) {
        waveform.geometry.vertices[i].x = Math.sqrt(Math.abs(FreqArray[i*150] * 13));
    }
    waveform.geometry.verticesNeedUpdate = true;

    //Store the waveform data
    analyser.getFloatFrequencyData(FreqArray);

    //update waveform
    for (var i = 0; i < 100; i++) {
        var l = Math.pow(i, 2.1); //logarithm scale
        l = Math.floor(l); //round for index
        var bin = FreqArray[l];
        frequency.geometry.vertices[i].x = -2 - Math.max(bin,-180)/70;
    }

    frequency.geometry.verticesNeedUpdate = true;

    // do the render
    render();

}

// render the scene
function render() {

    var Seconds     = Date.now() * 0.0001;
    var PIseconds	= Seconds * Math.PI;

    // animation of all objects
    meshes.forEach(function(object3d, idx){
        if( object3d instanceof THREE.Mesh === false )	return
        var S = Seconds + 0.33333*idx;
        var PS = S;// * Math.PI;
        var s = Math.sqrt(Math.abs(25-Math.pow(object3d.position.y,2)))/5;//Math.sin(PS/2);
        object3d.position.y = -5 + ((S * 5) % 10);
        object3d.scale.x = object3d.scale.z = s;
    });

    renderer.render( scene, camera );
}
