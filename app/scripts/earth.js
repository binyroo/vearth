
var radius = 6371;
var tilt = 0.41;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var container;
var camera, scene, renderer, stats;
var geometry, meshPlanet;
var directionalLight;

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1e7);
    camera.position.z = radius * 8;

    scene = new THREE.Scene();

    directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(-1, 0, 1);

    scene.add(directionalLight);

    geometry = new THREE.SphereGeometry(radius, 100, 50);

    meshPlanet = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ color: 0xff3333 })
    );

    scene.add(meshPlanet);

    renderer = new THREE.WebGLRenderer({
        alpha: false
    });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.sortObjects = false;
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.zIndex = 10000;
    container.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize(e) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
}

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {
    renderer.clear();
    renderer.render(scene, camera);
}