import '../../style.css';
import * as THREE from "three";
import { createThreeScene, handleKeys, onWindowResize, renderScene,	updateThree} from "./myThreeHelper.js";
import { createAmmoWorld, updatePhysics } from "./myAmmoHelper.js";
import {createPinballGame} from "./pinballGame.js";

//MERK: Denne brukes også i myThreeHelper:
export const ri = {
	currentlyPressedKeys: [],
	scene: undefined,
	renderer: undefined,
	camera: undefined,
	clock: undefined,
	controls: undefined,
	lilGui: undefined
};

export const gameInfo = {
	points: 0,
	ballNumber: 0,
	canShoot: true,
}

export function main() {
	//Input - standard Javascript / WebGL:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	// three:
	createThreeScene();

	// ammo
	createAmmoWorld(true);  //<<=== MERK!

	// Klokke for animasjon
	ri.clock = new THREE.Clock();

	//Håndterer endring av vindusstørrelse:
	window.addEventListener('resize', onWindowResize, false);

	//Input - standard Javascript:
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	// three/ammo-objekter:
	addAmmoSceneObjects();
}

function handleKeyUp(event) {
	ri.currentlyPressedKeys[event.code] = false;
}

function handleKeyDown(event) {
	ri.currentlyPressedKeys[event.code] = true;
}

function addAmmoSceneObjects() {
	const loadingManager = new THREE.LoadingManager();
	const textureLoader = new THREE.TextureLoader(loadingManager);
	const textureObjects = [];
	textureObjects[0] = textureLoader.load('../../../textures/pinballtekstur2.png');

	loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
		console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
	};
	loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
	};
	loadingManager.onError = (url) => {
		console.log( 'There was an error loading ' + url );
	};
	loadingManager.onLoad = () => {
		// Fortsetter...
		addAmmoSceneObjectsContinued(textureObjects);
	}
}

function updatePoints(){
	document.getElementById('points').innerHTML = String(gameInfo.points)
	document.getElementById('ball').innerHTML = String(gameInfo.ballNumber)

	let scoreList = [0, 0, 0, 0, 0, 0]
	let scoreDigits = String(gameInfo.points).split('').map(Number);

	scoreList.fill(0);
    for (let i = 0; i < scoreDigits.length; i++) {
        scoreList[scoreList.length - 1 - i] = scoreDigits[scoreDigits.length - 1 - i];
    }
	let mesh;

	//flytter alle tallene tilbake til "usynlig", inni brettet
	for (let i = 0; i < 6; i++){
		for (let j = 0; j <= 9; j++){
			mesh = ri.scene.getObjectByName('num' + String(i) + String(j))
			mesh.position.z = -3.7

		}
	}

	//flytter fram aktuelle tall
	for (let i = 0; i < 6; i++){
		mesh = ri.scene.getObjectByName('num' + String(i) + String(scoreList[i]))
			mesh.position.z = -3.5
	}





}



function addAmmoSceneObjectsContinued(textureObjects) {
	//Spillbrettet må helle litt for å få ballen til å rulle:
	let gameboardXrotationAngle = Math.PI/20;
	createPinballGame(textureObjects, gameboardXrotationAngle);
	animate(0);
}

function animate(currentTime, myThreeScene, myAmmoPhysicsWorld) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, myThreeScene, myAmmoPhysicsWorld);
	});
	let deltaTime = ri.clock.getDelta();

	//Oppdaterer grafikken:
	updateThree(deltaTime);

	//Oppdaterer fysikken:
	updatePhysics(deltaTime);

	//Sjekker input:
	handleKeys(deltaTime);

	//oppdater poeng
	updatePoints();

	//Tegner scenen med gitt kamera:
	renderScene();
}
