
var radius = 6371;
var tilt = 0.41;
var defaultCameraDistance = radius * 8;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var container;
var camera, scene, renderer, stats;
var geometry, meshPlanet;
var directionalLight;

var cameraQuaternion = new THREE.Quaternion();

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1e7);
    camera.position.z = defaultCameraDistance;

    scene = new THREE.Scene();

    directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 0, 1);

    scene.add(directionalLight);

    var planetTexture = THREE.ImageUtils.loadTexture('images/earth_atmos_2048.jpg');

    geometry = new THREE.SphereGeometry(radius, 100, 50);

    meshPlanet = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ map: planetTexture })
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

    container.addEventListener("mousedown", onMouseDown, false);

}

function onMouseDown(e) {

    e.preventDefault();

    // 지구에 찍은 마우스 포인터를 3D 좌표로 변환하여 가져온다.
    var pickedPoint = getPickedPointOnGlobe(camera, e.offsetX, e.offsetY);

    // 지구를 찍었다면 포인트가 있을것임.
    if (pickedPoint) {

        positionOnMouseDown = pickedPoint;

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mouseout', onMouseOut, false);

    } else {

        positionOnMouseDown = null;
    }
}

function onMouseMove(e) {

    var pickedPoint = getPickedPointOnGlobe(camera, e.offsetX, e.offsetY);

    if (pickedPoint) {

        var q = quaternionFromPosition(positionOnMouseDown, pickedPoint);

        cameraQuaternion = q.multiply(cameraQuaternion);
    }
}

function onMouseUp(e) {

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    document.removeEventListener('mouseout', onMouseOut, false);
}

function onMouseOut(e) {

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    document.removeEventListener('mouseout', onMouseOut, false);
}

function onWindowResize(e) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
}

function getPickedPointOnGlobe(camera, x, y) {

    // 마우스 좌표를 정규좌표로 변환한다.
    var vector = new THREE.Vector3(
        (x / SCREEN_WIDTH) * 2 - 1,
        -(y / SCREEN_HEIGHT) * 2 + 1,
        0.5
    );

    // 정규좌표를 unproject한 3D 좌표를 구한다.
    var projector = new THREE.Projector();
    projector.unprojectVector(vector, camera);

    // Raycaster(광선추적)이란
    // 어딘가에서 바라보는 방향을 통해 특정 오브젝트를 추적하는 기능을 한다.
    var raycaster = new THREE.Raycaster(
        camera.position, // origin
        vector.sub(camera.position).normalize() // direction
    );

    // raycaster를 통해 지구 메시가 있는지 추적하고 그 정보를 받아온다.
    var intersect = raycaster.intersectObject(meshPlanet)[0];

    return intersect ? intersect.point : null;
}

function quaternionFromPosition(p1, p2) {

    // 두 좌표의 법선백터를 구한다.
    // 법선백터는 회전을 위한 축으로 쓰인다.
    var crossVector = new THREE.Vector3();
    crossVector.crossVectors(p2, p1).normalize();

    // 두 좌표의 각을 구한다.
    var angle = p1.angleTo(p2);

    // 축과 각으로 회전을 위한 쿼터니언을 구한다.
    var quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(crossVector, angle);

    return quaternion;
}

function updateCameraMatrix() {

    var positionMatrix = new THREE.Matrix4(),
        defaultPosition = new THREE.Vector3(0, 0, defaultCameraDistance);

    positionMatrix.setPosition(defaultPosition);
    positionMatrix.lookAt(defaultPosition, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));

    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromQuaternion(cameraQuaternion);

    // 카메라의 위치를 정하고 회전 시켜야 한다.
    // 매트릭스 연산은 거꾸로 해야한다.
    var finalMatrix = new THREE.Matrix4();
    finalMatrix.multiply(rotationMatrix);
    finalMatrix.multiply(positionMatrix);

    camera.matrix.identity();
    camera.applyMatrix(finalMatrix);
    camera.updateMatrix();

    directionalLight.position = camera.position.clone().normalize();
}

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {

    updateCameraMatrix();

    renderer.clear();
    renderer.render(scene, camera);
}
