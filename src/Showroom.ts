import * as THREE from 'three';

export class Showroom {
  public mesh: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.mesh.add(floor);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 0.5), wallMaterial);
    backWall.position.set(0, 4, -5);
    backWall.receiveShadow = true;
    this.mesh.add(backWall);

    const sideWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 4), wallMaterial);
    sideWallLeft.position.set(-5, 4, -3);
    sideWallLeft.receiveShadow = true;
    this.mesh.add(sideWallLeft);

    const sideWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 12), wallMaterial);
    sideWallRight.position.set(-5, 4, 9);
    sideWallRight.receiveShadow = true;
    this.mesh.add(sideWallRight);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), wallMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 9;
    this.mesh.add(ceiling);
  }
}