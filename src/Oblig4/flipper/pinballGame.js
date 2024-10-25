import * as THREE from "three";
import {
	COLLISION_GROUP_BUMPER,
	COLLISION_GROUP_PLANE,
	COLLISION_GROUP_SPHERE,
	createAmmoRigidBody,
	phy
} from "./myAmmoHelper.js";
import {addMeshToScene} from "./myThreeHelper.js";
import {createFlipperArm} from "./armHingeConstraint.js";
import { floor } from "three/webgpu";
import { AmmoPhysics } from "three/examples/jsm/Addons.js";

/**
 * Oppretter hele spillet.
 * Merk størrelser; anta at en enhet er en meter, dvs. flipperSize = {with=1.1, ...} betyr at bredde på flipperen er
 * 1,1 meter, dvs. relativt store og de kunne nok vært mindre. Det står imidlertid i forhold til størrelsen på
 * spillbrettet (3,4 meter bredt) og kulene som f.eks. har en diameter på 20cm.
 *
 * Bevegelser på flippere og kuler kan dermed virke litt trege. I så fall er det bare å gjør spillet mindre.
 * */
export function createPinballGame(textureObjects, angle) {
	const position={x:0, y:0, z:0}
	createBoard(textureObjects[0], position, angle);

	let flipperSize = {width: 1.1, height: 0.1, depth:0.1}	;

	//Flipper1:
	let position1 = {x: -1.5, y: 0, z: 2.0};	//I forhold til at brettet står i posisjon 0,0,0
	createFlipperArm( 1, 0x00FF00, position1, true, "left_hinge_arm", angle, flipperSize);
	//Flipper2:
	let position2 = {x: 1.15, y: 0, z: 2.0};	//I forhold til at brettet står i posisjon 0,0,0
	createFlipperArm( 1, 0x00FF00, position2, false, "right_hinge_arm", angle, flipperSize);

	addBumpers(angle);
}

/**
 * Spillbrett med hinder og kanter som en gruppe (uten bumpere eller flippere).
 */
export function createBoard(textureObject, position, angle) {
	//Brettet skal stå i ro:
	const mass = 0;

	let floorSize = {width: 3.4, height: 0.1, depth: 7.5};
	let glassSize = {width: 3.2, height: 0.05, depth: 7.3};
	let edge1Size = {width: 0.1, height: 0.6, depth: 7.5};
	let starterEdgeSize = {width: 0.1, height: 0.5, depth: 5.5};
	let topEdgeSize = {width: 3.2, height: 0.6, depth: 0.1};

	let leader1Size = {width: 1.16, height: 0.2, depth: 0.1};
	let leader2Size = {width: 1,    height: 0.2, depth: 0.1};
	let leader3Size = {width: 0.5, height: 0.2, depth: 0.1};
	let leader4Size = {width: 1.16, height: 0.2, depth: 0.1};
	let leader5Size = {width: 0.5, height: 0.2, depth: 0.1};

	let bottomLeaderSize = {width: 1.5, height: 0.5, depth: 0.1};



	let leader1Position = {x: 1.23, y: 0.15, z: -3.3};
	let leader2Position = {x: -1.2, y: 0.15, z: -1.3};
	let leader3Position = {x: 1, y: 0.15, z: -0.3};
	let leader4Position = {x: -0.7, y: 0.15, z: -2.3};
	let leader5Position = {x: 0, y: 0.15, z: 0};

	let bottomLeaderLeftPosition = {x: -1, y: 0.3, z: 3.33};
	let bottomLeaderRightPosition = {x: 0.62, y: 0.3, z: 3.33};

	let floorPosition = {x: 0, y: 0, z: 0};
	let glassPosition = {x: 0, y: 0.595, z: 0};
	let leftEdgePosition = {x: -1.65, y: 0.35, z: 0};
	let rightEdgePosition = {x: 1.65, y: 0.35, z: 0};
	let starterEdgePosition = {x: 1.3, y: 0.3, z: 1};
	let topEdgePosition = {x: 0, y: 0.35, z: -3.7};
	let bottomEdgePosition = {x: 0, y: 0.35, z: 3.7};

	


	const floorMaterial = new THREE.MeshPhongMaterial({map: textureObject})  
	const glassMaterial = new THREE.MeshPhysicalMaterial({transmission: 1, roughness: 0, thickness: 0.05 })
	const edgeMaterial = new THREE.MeshPhongMaterial({color: 0xff0000})

	//THREE
	let groupMesh = new THREE.Group();
	groupMesh.name = 'pinballBoard';
	groupMesh.rotation.x = angle;

	//Floor

	let geoFloor = new THREE.BoxGeometry(floorSize.width, floorSize.height, floorSize.depth);
	let meshFloor = new THREE.Mesh(geoFloor, floorMaterial);
	meshFloor.position.set(floorPosition.x, floorPosition.y, floorPosition.z);
	meshFloor.castShadow = true;
	groupMesh.add(meshFloor)

	//glass
	let geoGlass = new THREE.BoxGeometry(glassSize.width, glassSize.height, glassSize.depth)
	let meshGlass = new THREE.Mesh(geoGlass, glassMaterial)
	meshGlass.position.set(glassPosition.x, glassPosition.y, glassPosition.z);
	meshGlass.castShadow = true;
	groupMesh.add(meshGlass)

	//left Edge
	let LeftEdgeGeometry = new THREE.BoxGeometry(edge1Size.width, edge1Size.height, edge1Size.depth)
	let meshLeftEdge = new THREE.Mesh(LeftEdgeGeometry, edgeMaterial)
	meshLeftEdge.position.set(leftEdgePosition.x, leftEdgePosition.y, leftEdgePosition.z)
	meshLeftEdge.name = 'edgeLeft'
	meshLeftEdge.collisionResponse = (mesh1) => {
		mesh1.material.color.setHex(Math.random()* 0xffffff);
	};
	groupMesh.add(meshLeftEdge);

	//right Edge
	let meshRightEdge = new THREE.Mesh(LeftEdgeGeometry, edgeMaterial)
	meshRightEdge.position.set(rightEdgePosition.x, rightEdgePosition.y, rightEdgePosition.z)
	meshRightEdge.name = 'edgeRight'
	meshRightEdge.collisionResponse = (mesh1) => {
		mesh1.material.color.setHex(Math.random()* 0xffffff);
	};
	groupMesh.add(meshRightEdge);

	//starter ramp Edge
	let starterEdgeGeometry = new THREE.BoxGeometry(starterEdgeSize.width, starterEdgeSize.height, starterEdgeSize.depth)
	let meshStarterEdge = new THREE.Mesh(starterEdgeGeometry, edgeMaterial)
	meshStarterEdge.position.set(starterEdgePosition.x, starterEdgePosition.y, starterEdgePosition.z)
	meshStarterEdge.name = 'edgeStarter'
	meshStarterEdge.collisionResponse = (mesh1) => {
		mesh1.material.color.setHex(Math.random()* 0xffffff);
	};
	groupMesh.add(meshStarterEdge);

	//top Edge
	let topEdgeGeometry = new THREE.BoxGeometry(topEdgeSize.width, topEdgeSize.height, topEdgeSize.depth)
	let meshTopEdge = new THREE.Mesh(topEdgeGeometry, edgeMaterial)
	meshTopEdge.position.set(topEdgePosition.x, topEdgePosition.y, topEdgePosition.z)
	meshTopEdge.name = 'edgeTop'
	meshTopEdge.collisionResponse = (mesh1) => {
		mesh1.material.color.setHex(Math.random()* 0xffffff);
	};
	groupMesh.add(meshTopEdge);

	//bottom Edge
	let bottomEdgeGeometry = new THREE.BoxGeometry(topEdgeSize.width, topEdgeSize.height, topEdgeSize.depth)
	let meshBottomEdge = new THREE.Mesh(bottomEdgeGeometry, edgeMaterial)
	meshBottomEdge.position.set(bottomEdgePosition.x, bottomEdgePosition.y, bottomEdgePosition.z)
	meshBottomEdge.name = 'edgeBottom'
	meshBottomEdge.collisionResponse = (mesh1) => {
		mesh1.material.color.setHex(Math.random()* 0xffffff);
	};
	groupMesh.add(meshBottomEdge);

	//Leader1
	let leader1Geometry = new THREE.BoxGeometry(leader1Size.width, leader1Size.height, leader1Size.depth)
	let leader1Mesh = new THREE.Mesh(leader1Geometry, edgeMaterial)
	leader1Mesh.position.set(leader1Position.x, leader1Position.y, leader1Position.z)
	leader1Mesh.rotateY(-Math.PI/4);
	groupMesh.add(leader1Mesh)

	//Leader2
	let leader2Geometry = new THREE.BoxGeometry(leader2Size.width, leader2Size.height, leader2Size.depth)
	let leader2Mesh = new THREE.Mesh(leader2Geometry, edgeMaterial)
	leader2Mesh.position.set(leader2Position.x, leader2Position.y, leader2Position.z)
	leader2Mesh.rotateY(-Math.PI/10);
	groupMesh.add(leader2Mesh)

	//Leader3
	let leader3Geometry = new THREE.BoxGeometry(leader3Size.width, leader3Size.height, leader3Size.depth)
	let leader3Mesh = new THREE.Mesh(leader3Geometry, edgeMaterial)
	leader3Mesh.position.set(leader3Position.x, leader3Position.y, leader3Position.z)
	leader3Mesh.rotateY(Math.PI/10);
	groupMesh.add(leader3Mesh)

	//Leader4
	let leader4Geometry = new THREE.BoxGeometry(leader4Size.width, leader4Size.height, leader4Size.depth)
	let leader4Mesh = new THREE.Mesh(leader4Geometry, edgeMaterial)
	leader4Mesh.position.set(leader4Position.x, leader4Position.y, leader4Position.z)
	leader4Mesh.rotateY(Math.PI/4);
	groupMesh.add(leader4Mesh)

	//Leader5
	let leader5Geometry = new THREE.BoxGeometry(leader5Size.width, leader5Size.height, leader5Size.depth)
	let leader5Mesh = new THREE.Mesh(leader5Geometry, edgeMaterial)
	leader5Mesh.position.set(leader5Position.x, leader5Position.y, leader5Position.z)
	leader5Mesh.rotateY(Math.PI/6);
	groupMesh.add(leader5Mesh)

	//Bottom leader left
	let bottomLeaderLeftGeometry = new THREE.BoxGeometry(bottomLeaderSize.width, bottomLeaderSize.height, bottomLeaderSize.depth)
	let bottomLeaderLeftMesh = new THREE.Mesh(bottomLeaderLeftGeometry, edgeMaterial)
	bottomLeaderLeftMesh.position.set(bottomLeaderLeftPosition.x, bottomLeaderLeftPosition.y, bottomLeaderLeftPosition.z)
	bottomLeaderLeftMesh.rotateY(-Math.PI/6);
	groupMesh.add(bottomLeaderLeftMesh)


	//Bottom leader right
	let bottomLeaderRightMesh = new THREE.Mesh(bottomLeaderLeftGeometry, edgeMaterial)
	bottomLeaderRightMesh.position.set(bottomLeaderRightPosition.x, bottomLeaderRightPosition.y, bottomLeaderRightPosition.z)
	bottomLeaderRightMesh.rotateY(Math.PI/6);
	groupMesh.add(bottomLeaderRightMesh)






	//AMMO
	let compoundShape = new Ammo.btCompoundShape();
	let floorShape = new Ammo.btBoxShape(new Ammo.btVector3(floorSize.width/2, floorSize.height/2, floorSize.depth/2))
	let glassShape = new Ammo.btBoxShape(new Ammo.btVector3(glassSize.width/2, glassSize.height/2, glassSize.depth/2))
	let leftEdgeShape = new Ammo.btBoxShape(new Ammo.btVector3(edge1Size.width/2, edge1Size.height/2, edge1Size.depth/2))
	let starterEdgeShape = new Ammo.btBoxShape(new Ammo.btVector3(starterEdgeSize.width/2, starterEdgeSize.height/2, starterEdgeSize.depth/2))
	let topEdgeShape = new Ammo.btBoxShape(new Ammo.btVector3(topEdgeSize.width/2, topEdgeSize.height/2, topEdgeSize.depth/2))
	let leader1Shape = new Ammo.btBoxShape(new Ammo.btVector3(leader1Size.width/2, leader1Size.height/2, leader1Size.depth/2))
	let leader2Shape = new Ammo.btBoxShape(new Ammo.btVector3(leader2Size.width/2, leader2Size.height/2, leader2Size.depth/2))
	let leader3Shape = new Ammo.btBoxShape(new Ammo.btVector3(leader3Size.width/2, leader3Size.height/2, leader3Size.depth/2))
	let leader4Shape = new Ammo.btBoxShape(new Ammo.btVector3(leader4Size.width/2, leader4Size.height/2, leader4Size.depth/2))
	let leader5Shape = new Ammo.btBoxShape(new Ammo.btVector3(leader5Size.width/2, leader5Size.height/2, leader5Size.depth/2))

	let bottomLeaderShape = new Ammo.btBoxShape(new Ammo.btVector3(bottomLeaderSize.width/2, bottomLeaderSize.height/2, bottomLeaderSize.depth/2))

	let transFloor = new Ammo.btTransform();
	transFloor.setIdentity();
	transFloor.setOrigin(new Ammo.btVector3(floorPosition.x, floorPosition.y, floorPosition.z))
	compoundShape.addChildShape(transFloor, floorShape)

	let transGlass = new Ammo.btTransform();
	transGlass.setIdentity();
	transGlass.setOrigin(new Ammo.btVector3(glassPosition.x, glassPosition.y, glassPosition.z))
	compoundShape.addChildShape(transGlass, glassShape)

	let transLeftEdge = new Ammo.btTransform();
	transLeftEdge.setIdentity();
	transLeftEdge.setOrigin(new Ammo.btVector3(leftEdgePosition.x, leftEdgePosition.y, leftEdgePosition.z));
	compoundShape.addChildShape(transLeftEdge, leftEdgeShape)

	let transRightEdge = new Ammo.btTransform();
	transRightEdge.setIdentity();
	transRightEdge.setOrigin(new Ammo.btVector3(rightEdgePosition.x, rightEdgePosition.y, rightEdgePosition.z));
	compoundShape.addChildShape(transRightEdge, leftEdgeShape)

	let transStarterEdge = new Ammo.btTransform();
	transStarterEdge.setIdentity();
	transStarterEdge.setOrigin(new Ammo.btVector3(starterEdgePosition.x, starterEdgePosition.y, starterEdgePosition.z));
	compoundShape.addChildShape(transStarterEdge, starterEdgeShape)

	let transTopEdge = new Ammo.btTransform();
	transTopEdge.setIdentity();
	transTopEdge.setOrigin(new Ammo.btVector3(topEdgePosition.x, topEdgePosition.y, topEdgePosition.z));
	compoundShape.addChildShape(transTopEdge, topEdgeShape)

	let transBottomEdge = new Ammo.btTransform();
	transBottomEdge.setIdentity();
	transBottomEdge.setOrigin(new Ammo.btVector3(bottomEdgePosition.x, bottomEdgePosition.y, bottomEdgePosition.z));
	compoundShape.addChildShape(transBottomEdge, topEdgeShape)

	let transLeader1 = new Ammo.btTransform();
	transLeader1.setIdentity();
	transLeader1.setOrigin(new Ammo.btVector3(leader1Position.x, leader1Position.y, leader1Position.z))
	let quaternion = leader1Mesh.quaternion;
	transLeader1.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transLeader1, leader1Shape);

	let transLeader2 = new Ammo.btTransform();
	transLeader2.setIdentity();
	transLeader2.setOrigin(new Ammo.btVector3(leader2Position.x, leader2Position.y, leader2Position.z))
	quaternion = leader2Mesh.quaternion;
	transLeader2.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transLeader2, leader2Shape);

	let transLeader3 = new Ammo.btTransform();
	transLeader3.setIdentity();
	transLeader3.setOrigin(new Ammo.btVector3(leader3Position.x, leader3Position.y, leader3Position.z))
	quaternion = leader2Mesh.quaternion;
	transLeader3.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transLeader3, leader3Shape);

	let transLeader4 = new Ammo.btTransform();
	transLeader4.setIdentity();
	transLeader4.setOrigin(new Ammo.btVector3(leader4Position.x, leader4Position.y, leader4Position.z))
	quaternion = leader4Mesh.quaternion;
	transLeader4.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transLeader4, leader4Shape);

	let transLeader5 = new Ammo.btTransform();
	transLeader5.setIdentity();
	transLeader5.setOrigin(new Ammo.btVector3(leader5Position.x, leader5Position.y, leader5Position.z))
	quaternion = leader5Mesh.quaternion;
	transLeader5.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transLeader5, leader5Shape);

	let transBottomLeaderLeft = new Ammo.btTransform();
	transBottomLeaderLeft.setIdentity();
	transBottomLeaderLeft.setOrigin(new Ammo.btVector3(bottomLeaderLeftPosition.x, bottomLeaderLeftPosition.y, bottomLeaderLeftPosition.z))
	quaternion = bottomLeaderLeftMesh.quaternion;
	transBottomLeaderLeft.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transBottomLeaderLeft, bottomLeaderShape);

	let transBottomLeaderRight = new Ammo.btTransform();
	transBottomLeaderRight.setIdentity();
	transBottomLeaderRight.setOrigin(new Ammo.btVector3(bottomLeaderRightPosition.x, bottomLeaderRightPosition.y, bottomLeaderRightPosition.z))
	quaternion = bottomLeaderRightMesh.quaternion;
	transBottomLeaderRight.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))
	compoundShape.addChildShape(transBottomLeaderRight, bottomLeaderShape);

	compoundShape.setMargin(0.05);

	

	let rigidBody = createAmmoRigidBody(compoundShape, groupMesh, 0.2, 0.9, position, mass);
	groupMesh.userData.physicsBody = rigidBody;
	// Legger til physics world:
	phy.ammoPhysicsWorld.addRigidBody(rigidBody, COLLISION_GROUP_PLANE, COLLISION_GROUP_SPHERE);
	addMeshToScene(groupMesh);
	phy.rigidBodies.push(groupMesh);
	rigidBody.threeMesh = groupMesh;
}

/**
 * Legger til bumpers. Må ha et navn (.name) som starter med 'bumper'.
 * Dette henger sammen med kollisjonshåndteringen. Se myAmmoHelper.js og checkCollisions-funksjonen.
 */
function addBumpers(angle) {

	//bumper1
	let bumper1Size = {radiusTop: 0.2, radiusBottom: 0.2, height: 0.4};
	let bumper1Position = {x: -0.3, y: bumper1Size.height/2, z: -1.3};
	bumper1Position.y += (-Math.tan(angle) * bumper1Position.z);

	//bumper2
	let bumper2Size = {radiusTop: 0.3, radiusBottom: 0.3, height: 0.4};
	let bumper2Position = {x: 0.7, y: bumper2Size.height/2, z: -1};
	bumper2Position.y += (-Math.tan(angle) * bumper2Position.z);

	//bumper3
	let bumper3Size = {radiusTop: 0.15, radiusBottom: 0.15, height: 0.4};
	let bumper3Position = {x: 0, y: bumper3Size.height/2, z: 1.5};
	bumper3Position.y += (-Math.tan(angle) * bumper3Position.z);

	//bumper4
	let bumper4Size = {radiusTop: 0.3, radiusBottom: 0.1, height: 0.4};
	let bumper4Position = {x: 0.55, y: bumper4Size.height/2, z: 0.85};
	bumper4Position.y += (-Math.tan(angle) * bumper4Position.z);

	//bumper5
	let bumper5Size = {radiusTop: 0.2, radiusBottom: 0.2, height: 0.4};
	let bumper5Position = {x: -1.15, y: bumper5Size.height/2, z: 0.75};
	bumper5Position.y += (-Math.tan(angle) * bumper5Position.z);

	//bumper6
	let bumper6Size = {radiusTop: 0.3, radiusBottom: 0.2, height: 0.4};
	let bumper6Position = {x: -1.1, y: bumper6Size.height/2, z: -3};
	bumper6Position.y += (-Math.tan(angle) * bumper6Position.z);





	addBumper(angle, bumper1Size, bumper1Position, "bumper1", 200)
	addBumper(angle, bumper2Size, bumper2Position, "bumper2", 200)
	addBumper(angle, bumper3Size, bumper3Position, "bumper3", 200)
	addBumper(angle, bumper4Size, bumper4Position, "bumper4", 200)
	addBumper(angle, bumper5Size, bumper5Position, "bumper5", 200)
	addBumper(angle, bumper6Size, bumper6Position, "bumper6", 400)
}

/**
 * Legger til en bumper. Bumperen er en sylinder med radiusTop, radiusBottom og height.
 */
function addBumper(angle, size, position, name, points) {
	let mass = 0;
	let color = Math.random() * 0xffffff;


	const material = new THREE.MeshPhongMaterial({color: color, transparent: false});
	let geoBumper = new THREE.CylinderGeometry(size.radiusTop, size.radiusBottom, size.height)
	let meshBumper = new THREE.Mesh(geoBumper, material);
	meshBumper.name = name;
	meshBumper.position.set(position.x, position.y, position.z)
	meshBumper.rotation.x = angle;
	meshBumper.points = points;
	meshBumper.collisionResponse = (mesh1) => {
		//Oppdater en Poengvariabel her
		mesh1.material.color.setHex(Math.random() * 0xffffff)
	}


	

	//AMMO

	let bumperShape = new Ammo.btCylinderShape(new Ammo.btVector3(size.radiusTop, size.radiusBottom, size.height))
	let transBumper = new Ammo.btTransform();
	transBumper.setIdentity();
	transBumper.setOrigin(new Ammo.btVector3(position.x, position.y, position.z))
	let quaternion = meshBumper.quaternion;
	transBumper.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w))

	let rigidBody = createAmmoRigidBody(bumperShape, meshBumper, 0.2, 0.9, position, mass);
	meshBumper.userData.physicsBody = rigidBody;
	// Legger til physics world:
	phy.ammoPhysicsWorld.addRigidBody(rigidBody, COLLISION_GROUP_BUMPER, COLLISION_GROUP_SPHERE);
	addMeshToScene(meshBumper);
	phy.rigidBodies.push(meshBumper);
	rigidBody.threeMesh = meshBumper;

}