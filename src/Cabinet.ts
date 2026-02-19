import * as THREE from 'three';

export class Cabinet {
  public mesh: THREE.Group;
  private material: THREE.MeshStandardMaterial;
  private parts: { [key: string]: THREE.Mesh };
  private thickness: number = 0.05;

  constructor(material: THREE.MeshStandardMaterial) {
    this.mesh = new THREE.Group();
    this.material = material;
    this.parts = {};

    this.createPanel('left');
    this.createPanel('right');
    this.createPanel('top');
    this.createPanel('bottom');
    this.createPanel('back');
  }

  private createPanel(name: string) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.parts[name] = mesh;
    this.mesh.add(mesh);
  }

  public update(width: number, height: number, depth: number) {
    const t = this.thickness;

    this.resizePanel('left', t, height, depth);
    this.parts['left'].position.set(-width / 2 + t / 2, height / 2, 0);

    this.resizePanel('right', t, height, depth);
    this.parts['right'].position.set(width / 2 - t / 2, height / 2, 0);

    const innerWidth = width - (2 * t);
    this.resizePanel('top', innerWidth, t, depth);
    this.parts['top'].position.set(0, height - t / 2, 0);

    this.resizePanel('bottom', innerWidth, t, depth);
    this.parts['bottom'].position.set(0, t / 2, 0);

    const innerHeight = height - (2 * t);
    this.resizePanel('back', innerWidth, innerHeight, t);
    this.parts['back'].position.set(0, height / 2, -depth / 2 + t / 2);
  }

  private resizePanel(name: string, width: number, height: number, depth: number) {
    const mesh = this.parts[name];
    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(width, height, depth);
  }
}