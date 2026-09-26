import { useEffect, useRef, useState } from 'react';

// The characters are articulated meshes: every rep changes their joints, not a
// transition between pictures. Three.js is loaded only when the scene is visible.
export function WorkoutScene() {
  const mount = useRef(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduced || failed || !mount.current) return;
    let disposed = false;
    let visible = true;
    let raf = 0;
    let observer;
    let renderer;
    let resize;
    let cleanup = () => {};
    const element = mount.current;

    import('three').then(THREE => {
      if (disposed) return;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0c1518');
      scene.fog = new THREE.Fog('#0c1518', 9, 22);
      const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
      camera.position.set(0, 1.95, 8.8);
      camera.lookAt(0, 1.75, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      element.appendChild(renderer.domElement);

      const mat = (color, metalness = 0, roughness = 0.55) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
      const floorMat = mat('#172126', 0.35, 0.62);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), mat('#0f1a1d'));
      back.position.set(0, 6, -5.1);
      scene.add(back);

      const addBox = (w, h, d, material, x, y, z, parent = scene) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      };
      const graphite = mat('#293739', 0.7, 0.35);
      const lime = mat('#aaff64', 0.1, 0.28);
      const cyan = mat('#6dc7f0', 0.15, 0.28);
      const rail = mat('#526368', 0.8, 0.25);
      for (const x of [-5.0, 5.0]) {
        addBox(0.13, 5.2, 0.14, rail, x, 2.6, -4.5);
        addBox(0.75, 0.12, 0.55, graphite, x, 0.95, -4.2);
      }
      addBox(10.1, 0.11, 0.15, rail, 0, 4.8, -4.5);
      for (const x of [-4.5, -2.7, -0.9, 0.9, 2.7, 4.5]) {
        addBox(0.045, 4.5, 0.04, x < 0 ? lime : cyan, x, 2.4, -4.85);
      }
      const platform = addBox(7.7, 0.10, 3.6, mat('#1a2729', 0.2, 0.6), 0, 0.055, 0);
      platform.receiveShadow = true;
      addBox(7.7, 0.035, 0.035, lime, 0, 0.12, 1.8);
      for (const x of [-3.55, 3.55]) addBox(0.035, 0.035, 3.6, x < 0 ? lime : cyan, x, 0.12, 0);
      const grid = new THREE.GridHelper(40, 40, '#26383c', '#1a292d');
      grid.position.y = 0.012;
      scene.add(grid);

      scene.add(new THREE.HemisphereLight('#d9eeff', '#23392e', 2.5));
      const key = new THREE.DirectionalLight('#fff5e8', 3.5);
      key.position.set(-3, 7, 7);
      key.castShadow = true;
      key.shadow.mapSize.set(512, 512);
      key.shadow.camera.left = -7;
      key.shadow.camera.right = 7;
      key.shadow.camera.top = 7;
      key.shadow.camera.bottom = -7;
      scene.add(key);
      const rimLeft = new THREE.PointLight('#aaff64', 80, 12);
      rimLeft.position.set(-4, 3.4, -1);
      scene.add(rimLeft);
      const rimRight = new THREE.PointLight('#5dbfff', 80, 12);
      rimRight.position.set(4, 3.5, -1);
      scene.add(rimRight);

      const sphere = new THREE.SphereGeometry(1, 20, 14);
      const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
      const makePart = (parent, material, scale, at) => {
        const mesh = new THREE.Mesh(sphere, material);
        mesh.scale.set(...scale);
        mesh.position.set(...at);
        mesh.castShadow = true;
        parent.add(mesh);
        return mesh;
      };
      const segment = (parent, material, radius) => {
        const mesh = new THREE.Mesh(cylinder, material);
        mesh.castShadow = true;
        parent.add(mesh);
        mesh.userData.radius = radius;
        return mesh;
      };
      const point = (x, y, z) => new THREE.Vector3(x, y, z);
      const setSegment = (mesh, a, b, r1 = 1) => {
        const delta = b.clone().sub(a);
        mesh.position.copy(a).addScaledVector(delta, 0.5);
        mesh.quaternion.setFromUnitVectors(point(0, 1, 0), delta.clone().normalize());
        mesh.scale.set(mesh.userData.radius * r1, delta.length(), mesh.userData.radius * r1);
      };

      function avatar({ x, scale, male, accent }) {
        const root = new THREE.Group();
        root.position.x = x;
        root.scale.setScalar(scale);
        scene.add(root);
        const skin = mat(male ? '#d8a27b' : '#e3ad91', 0, 0.64);
        const hair = mat(male ? '#dce5ee' : '#101519', 0.08, 0.42);
        const shirt = mat(male ? '#e5edf2' : '#171e21', 0.08, 0.42);
        const shorts = mat(male ? '#222a30' : '#20292a', 0.08, 0.46);
        const shoe = mat(male ? '#eef6f5' : '#191f20', 0.06, 0.38);
        const eye = mat('#101818', 0, 0.22);
        const accentMat = male ? cyan : lime;
        const torso = new THREE.Group();
        root.add(torso);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(male ? 0.47 : 0.37, male ? 0.32 : 0.28, male ? 1.1 : 0.98, 24), shirt);
        body.scale.z = male ? 0.67 : 0.70;
        body.position.y = 0.55;
        body.castShadow = true;
        torso.add(body);
        makePart(torso, shorts, male ? [0.38, 0.22, 0.28] : [0.34, 0.20, 0.27], [0, -0.08, 0]);
        addBox(male ? 0.88 : 0.71, 0.055, 0.028, accentMat, 0, 0.07, 0.28, torso);
        const neck = makePart(torso, skin, [0.16, 0.17, 0.16], [0, 1.17, 0]);
        const head = new THREE.Group();
        head.position.y = 1.45;
        torso.add(head);
        makePart(head, skin, [0.25, 0.32, 0.23], [0, 0, 0]);
        makePart(head, hair, male ? [0.28, 0.15, 0.26] : [0.29, 0.16, 0.26], [0, 0.25, -0.04]);
        makePart(head, skin, [0.046, 0.055, 0.06], [0, -0.045, 0.225]);
        for (const side of [-1, 1]) {
          makePart(head, hair, [0.085, male ? 0.10 : 0.18, 0.10], [side * 0.20, male ? 0.20 : 0.15, 0.10]);
          makePart(head, eye, [0.042, 0.022, 0.017], [side * 0.105, 0.035, 0.226]);
          makePart(head, hair, [0.14, 0.048, 0.08], [side * 0.08, 0.27, 0.15]);
        }
        if (!male) {
          makePart(head, hair, [0.20, 0.39, 0.17], [0.25, -0.24, -0.12]);
          makePart(head, lime, [0.04, 0.23, 0.04], [0.37, -0.28, -0.04]);
        }
        const arms = [], legs = [], hands = [];
        for (const side of [-1, 1]) {
          arms.push({ upper: segment(root, shirt, male ? 0.20 : 0.17), fore: segment(root, skin, male ? 0.15 : 0.13), side });
          hands.push(makePart(root, skin, [0.12, 0.14, 0.12], [0, 0, 0]));
          legs.push({ thigh: segment(root, shorts, male ? 0.25 : 0.21), shin: segment(root, skin, male ? 0.19 : 0.16), side });
          makePart(root, shoe, [0.20, 0.13, 0.33], [side * 0.29, 0.17, 0.34]);
        }
        return { root, torso, body, head, arms, legs, hands, skin, accentMat, male, neck };
      }

      const woman = avatar({ x: -1.5, scale: 1, male: false });
      const man = avatar({ x: 1.5, scale: 1.07, male: true });
      const dumbbells = [];
      for (const side of [-1, 1]) {
        const group = new THREE.Group();
        man.root.add(group);
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 12), rail);
        grip.rotation.z = Math.PI / 2;
        group.add(grip);
        for (const x of [-0.21, 0.21]) {
          const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 14), graphite);
          plate.rotation.z = Math.PI / 2;
          plate.position.x = x;
          plate.castShadow = true;
          group.add(plate);
          const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.013, 6, 20), cyan);
          stripe.rotation.y = Math.PI / 2;
          stripe.position.x = x + (x < 0 ? -0.067 : 0.067);
          group.add(stripe);
        }
        dumbbells.push(group);
      }

      const renderPerson = (person, rep) => {
        const bend = person.male ? 0.09 * rep : 0.60 * rep;
        const hipY = 1.65 - bend;
        person.torso.position.y = hipY;
        person.torso.rotation.x = person.male ? 0.01 : 0.19 * rep;
        person.head.rotation.z = 0.02 * Math.sin(rep * Math.PI);
        for (let i = 0; i < 2; i++) {
          const side = i ? 1 : -1;
          const hip = point(side * 0.24, hipY - 0.08, 0);
          const knee = point(side * 0.29, 0.88 - bend * 0.32, 0.16 + bend * 0.75);
          const ankle = point(side * 0.29, 0.23, 0.29);
          setSegment(person.legs[i].thigh, hip, knee);
          setSegment(person.legs[i].shin, knee, ankle);
          const shoulder = point(side * (person.male ? 0.48 : 0.39), hipY + 0.99, 0);
          let elbow, hand;
          if (person.male) {
            elbow = point(side * 0.68, hipY + 0.66 + 0.54 * rep, 0.12);
            hand = point(side * 0.72, hipY + 1.04 + 0.92 * rep, 0.30);
            dumbbells[i].position.copy(hand);
            dumbbells[i].rotation.z = side * 0.12 * (1 - rep);
          } else {
            elbow = point(side * 0.48, hipY + 0.54, 0.36 + 0.33 * rep);
            hand = point(side * 0.32, hipY + 0.68, 0.67 + 0.32 * rep);
          }
          setSegment(person.arms[i].upper, shoulder, elbow);
          setSegment(person.arms[i].fore, elbow, hand);
          person.hands[i].position.copy(hand);
        }
      };

      resize = () => {
        const { width, height } = element.getBoundingClientRect();
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      window.addEventListener('resize', resize);
      observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; });
      observer.observe(element);
      let previous = 0;
      const start = performance.now();
      const animate = now => {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        if (!visible || pausedRef.current || now - previous < 32) return;
        previous = now;
        const t = (now - start) / 1000;
        const cycle = (Math.sin(t * Math.PI * 0.72 - Math.PI / 2) + 1) / 2;
        const rep = cycle * cycle * (3 - 2 * cycle);
        renderPerson(woman, rep);
        renderPerson(man, 1 - rep);
        camera.position.x = Math.sin(t * 0.22) * 0.10;
        camera.lookAt(0, 1.75, 0);
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(animate);
      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener('resize', resize);
        scene.traverse(object => {
          object.geometry?.dispose();
          if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => { if (!disposed) setFailed(true); });

    return () => { disposed = true; cleanup(); };
  }, [reduced, failed]);

  return <div className="motion-frame workout-scene" aria-label="Animated 3D male and female athletes doing squats and dumbbell presses">
    {reduced || failed ? <img src="/assets/training/poster-gym.jpg" alt="Male and female athletes training together" /> : <div className="workout-canvas" ref={mount} />}
    {!reduced && !failed && <button type="button" className="film-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play animation' : 'Pause animation'}>{paused ? '▶' : 'Ⅱ'}</button>}
    <span className="scene-label">FULL BODY · SQUAT + PRESS</span>
  </div>;
}
