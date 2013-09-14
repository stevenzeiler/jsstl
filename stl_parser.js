function fetchStl (url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if ( xhr.readyState == 4 ) {
      if ( xhr.status == 200 || xhr.status == 0 ) {
        var rep = xhr.response;
        callback(rep);
      }
    }
  }
  xhr.onerror = function(e) {
      console.log(e);
  }

  xhr.open( "GET", url, true );
  xhr.responseType = "arraybuffer";
  xhr.send( null );
}

function trim (str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
}

var camera, scene, renderer,
geometry, material, mesh, stats, directionalLight;



// Notes:
// - STL file format: http://en.wikipedia.org/wiki/STL_(file_format)
// - 80 byte unused header
// - All binary STLs are assumed to be little endian, as per wiki doc
// - Returns a THREE.Geometry
var parseStlBinary = function(stl) {
    var geo = new THREE.Geometry();
    var dv = new DataView(stl, 80); // 80 == unused header
    var isLittleEndian = true;
    var triangles = dv.getUint32(0, isLittleEndian); 

    // console.log('arraybuffer length:  ' + stl.byteLength);
    // console.log('number of triangles: ' + triangles);

    var offset = 4;
    for (var i = 0; i < triangles; i++) {
        // Get the normal for this triangle
        var normal = new THREE.Vector3(
            dv.getFloat32(offset, isLittleEndian),
            dv.getFloat32(offset+4, isLittleEndian),
            dv.getFloat32(offset+8, isLittleEndian)
        );
        offset += 12;

        // Get all 3 vertices for this triangle
        for (var j = 0; j < 3; j++) {
            geo.vertices.push(
                new THREE.Vector3(
                    dv.getFloat32(offset, isLittleEndian),
                    dv.getFloat32(offset+4, isLittleEndian),
                    dv.getFloat32(offset+8, isLittleEndian)
                )
            );
            offset += 12
        }

        // there's also a Uint16 "attribute byte count" that we
        // don't need, it should always be zero.
        offset += 2;   

        // Create a new face for from the vertices and the normal             
        geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, normal));
    }

    // The binary STL I'm testing with seems to have all
    // zeroes for the normals, unlike its ASCII counterpart.
    // We can use three.js to compute the normals for us, though,
    // once we've assembled our geometry. This is a relatively 
    // expensive operation, but only needs to be done once.
    geo.computeFaceNormals();
    stl = null;

    return geo;
};  

init();
animate();

function init() {

    //Detector.addGetWebGLMessage();
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 70;
    camera.position.y = 0;
    scene.add( camera );

    directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.x = 0; 
    directionalLight.position.y = 0; 
    directionalLight.position.z = 1; 
    directionalLight.position.normalize();
    scene.add( directionalLight );

    fetchStl('hand_ok.stl', function (stlBinary) {
      var geometry = parseStlBinary(stlBinary);
      mesh = new THREE.Mesh(geometry,
        // new THREE.MeshNormalMaterial({
        //     overdraw:true
        // }
        new THREE.MeshLambertMaterial({
            overdraw:true,
            color: 0xaa0000,
            shading: THREE.FlatShading
        })
      );
      scene.add(mesh);
      mesh.rotation.x = 5;
      mesh.rotation.z = .25;
      console.log('done parsing');
    });

    renderer = new THREE.WebGLRenderer(); //new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );
    renderer.domElement.style.top = '800px';

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
}

function animate() {
    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame( animate );
    render();
    stats.update();
}


function render() {

    //mesh.rotation.x += 0.01;

    mesh.position.y = -50;
    mesh.position.z = -150;
    
    if (mesh) {
        mesh.rotation.z += 0.01;
        //mesh.rotation.x += 0.02;
        //mesh.rotation.y += 0.03;
    }
    renderer.render( scene, camera );

}