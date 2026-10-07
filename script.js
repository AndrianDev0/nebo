const modal = document.querySelector('#booking-modal');
const bookingCopy = document.querySelector('#booking-copy');
const mobileNav = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('.menu-toggle');
const navClose = document.querySelector('.nav-close');
const mobileBook = document.querySelector('.mobile-book');
const hero = document.querySelector('.hero');
const heroMascot = document.querySelector('.hero-mascot');
const heroMascotControl = document.querySelector('[data-bear-control]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

document.documentElement.classList.add('motion-ready');

async function initBear3D() {
  if (!heroMascot || !heroMascotControl) return;
  const turnButtons = [...heroMascot.querySelectorAll('[data-bear-step]')];
  const setTurnButtonsDisabled = disabled => turnButtons.forEach(button => { button.disabled = disabled; });
  const setBearInteractivity = enabled => {
    setTurnButtonsDisabled(!enabled);
    heroMascot.classList.toggle('is-3d-ready', enabled);
    if (enabled) {
      heroMascotControl.removeAttribute('aria-hidden');
      heroMascotControl.setAttribute('role', 'img');
      heroMascotControl.setAttribute('tabindex', '0');
    } else {
      heroMascotControl.setAttribute('aria-hidden', 'true');
      heroMascotControl.removeAttribute('role');
      heroMascotControl.removeAttribute('tabindex');
    }
  };
  setBearInteractivity(false);

  if (navigator.connection?.saveData) {
    heroMascot.classList.add('is-3d-unavailable');
    return;
  }

  try {
    const [THREE, { RoundedBoxGeometry }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('three/addons/geometries/RoundedBoxGeometry.js'),
      import('three/addons/environments/RoomEnvironment.js')
    ]);

    let isCompactViewport = window.matchMedia('(max-width: 720px)').matches;
    const renderer = new THREE.WebGLRenderer({
      canvas: heroMascotControl,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    let appliedPixelRatio = Math.min(window.devicePixelRatio || 1, isCompactViewport ? 1.25 : 1.65);
    renderer.setPixelRatio(appliedPixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.72;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(49, 1, 0.1, 40);
    const bear = new THREE.Group();
    bear.name = 'NEBO Bear Viewer';
    scene.add(bear);

    let environmentTarget = null;
    const rebuildEnvironment = () => {
      environmentTarget?.dispose();
      const environmentGenerator = new THREE.PMREMGenerator(renderer);
      const environmentScene = new RoomEnvironment();
      environmentTarget = environmentGenerator.fromScene(environmentScene, 0.04);
      scene.environment = environmentTarget.texture;
      environmentGenerator.dispose();
      environmentScene.traverse(child => {
        child.geometry?.dispose?.();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach(material => material.dispose?.());
      });
    };
    rebuildEnvironment();

    const headMaterial = new THREE.MeshPhysicalMaterial({
      name: 'Obsidian head',
      color: 0x010101,
      metalness: 0.26,
      roughness: 0.17,
      clearcoat: 0.78,
      clearcoatRoughness: 0.12,
      reflectivity: 0.82,
      sheen: 0.08,
      sheenColor: 0x8ba7d3,
      sheenRoughness: 0.68,
      envMapIntensity: 0.42
    });
    const torsoMaterial = new THREE.MeshPhysicalMaterial({
      name: 'Obsidian torso',
      color: 0x030303,
      metalness: 0.2,
      roughness: 0.21,
      clearcoat: 0.64,
      clearcoatRoughness: 0.16,
      reflectivity: 0.76,
      sheen: 0.06,
      sheenColor: 0x92a9cf,
      envMapIntensity: 0.36
    });
    const limbMaterial = new THREE.MeshPhysicalMaterial({
      name: 'Obsidian limbs',
      color: 0x010101,
      metalness: 0.23,
      roughness: 0.19,
      clearcoat: 0.7,
      clearcoatRoughness: 0.14,
      envMapIntensity: 0.39
    });
    const earMaterial = new THREE.MeshPhysicalMaterial({
      name: 'Obsidian ear insets',
      color: 0x080808,
      metalness: 0.14,
      roughness: 0.29,
      clearcoat: 0.48,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.3
    });
    const faceMaterial = new THREE.MeshPhysicalMaterial({
      name: 'Obsidian face',
      color: 0x000000,
      metalness: 0.32,
      roughness: 0.1,
      clearcoat: 0.92,
      clearcoatRoughness: 0.07,
      envMapIntensity: 0.48
    });

    const addPart = (geometry, position, scale = [1, 1, 1], rotation = [0, 0, 0], material = headMaterial) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bear.add(mesh);
      return mesh;
    };

    const roundedBox = (width, height, depth, radius, segments = 5) => new RoundedBoxGeometry(width, height, depth, segments, radius);
    const signedPower = (value, power) => Math.sign(value) * Math.pow(Math.abs(value), power);
    const profiledBody = (rings, radialSegments = 58, roundnessPower = 0.84) => {
      const positions = [];
      const uvs = [];
      const indices = [];

      rings.forEach((ring, ringIndex) => {
        const v = ringIndex / (rings.length - 1);
        for (let longitude = 0; longitude <= radialSegments; longitude += 1) {
          const u = longitude / radialSegments;
          const theta = -Math.PI + u * Math.PI * 2;
          const x = ring.radiusX * signedPower(Math.cos(theta), roundnessPower);
          let z = ring.radiusZ * signedPower(Math.sin(theta), roundnessPower);
          if (z > 0 && ring.frontBulge) {
            const facing = Math.pow(Math.max(0, Math.sin(theta)), 2);
            z *= 1 + ring.frontBulge * facing;
          }
          positions.push(x, ring.y, z);
          uvs.push(u, 1 - v);
        }
      });

      const stride = radialSegments + 1;
      for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
        for (let longitude = 0; longitude < radialSegments; longitude += 1) {
          const a = ringIndex * stride + longitude;
          const b = a + stride;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }

      const bottomCenter = positions.length / 3;
      positions.push(0, rings[0].y, 0);
      uvs.push(0.5, 1);
      const topCenter = positions.length / 3;
      positions.push(0, rings[rings.length - 1].y, 0);
      uvs.push(0.5, 0);
      const topOffset = (rings.length - 1) * stride;
      for (let longitude = 0; longitude < radialSegments; longitude += 1) {
        indices.push(bottomCenter, longitude + 1, longitude);
        indices.push(topCenter, topOffset + longitude, topOffset + longitude + 1);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    };

    // Exact organic silhouette from the approved 16:09 version.
    addPart(new THREE.SphereGeometry(0.65, 52, 34), [-0.83, 3.34, -0.08], [1, 1.03, 0.43], [0, -0.08, -0.07], headMaterial);
    addPart(new THREE.SphereGeometry(0.65, 52, 34), [0.83, 3.34, -0.08], [1, 1.03, 0.43], [0, 0.08, 0.07], headMaterial);
    addPart(new THREE.SphereGeometry(0.49, 44, 30), [-0.83, 3.34, 0.15], [1, 1.03, 0.2], [0, -0.08, -0.07], earMaterial);
    addPart(new THREE.SphereGeometry(0.49, 44, 30), [0.83, 3.34, 0.15], [1, 1.03, 0.2], [0, 0.08, 0.07], earMaterial);

    const headGeometry = profiledBody([
      { y: -1.04, radiusX: 0.18, radiusZ: 0.18 },
      { y: -0.98, radiusX: 0.66, radiusZ: 0.48, frontBulge: 0.04 },
      { y: -0.8, radiusX: 0.96, radiusZ: 0.7, frontBulge: 0.14 },
      { y: -0.48, radiusX: 1.1, radiusZ: 0.78, frontBulge: 0.2 },
      { y: -0.12, radiusX: 1.12, radiusZ: 0.79, frontBulge: 0.16 },
      { y: 0.28, radiusX: 1.05, radiusZ: 0.77, frontBulge: 0.08 },
      { y: 0.62, radiusX: 0.96, radiusZ: 0.7, frontBulge: 0.03 },
      { y: 0.88, radiusX: 0.72, radiusZ: 0.5 },
      { y: 1.02, radiusX: 0.18, radiusZ: 0.16 }
    ], 64, 0.86);
    addPart(headGeometry, [0, 2.65, 0], [1, 1, 1], [0, 0, 0], headMaterial);
    addPart(new THREE.SphereGeometry(0.155, 36, 24), [0, 2.49, 0.98], [1.25, 0.62, 0.72], [0, 0, 0], faceMaterial);
    addPart(new THREE.SphereGeometry(0.22, 34, 20), [0, 2.63, 0.87], [1, 0.22, 0.34], [0, 0, 0], faceMaterial);

    const torsoGeometry = profiledBody([
      { y: -0.98, radiusX: 0.74, radiusZ: 0.47 },
      { y: -0.9, radiusX: 0.86, radiusZ: 0.58 },
      { y: -0.58, radiusX: 0.93, radiusZ: 0.64, frontBulge: 0.025 },
      { y: -0.08, radiusX: 0.96, radiusZ: 0.66, frontBulge: 0.035 },
      { y: 0.42, radiusX: 0.94, radiusZ: 0.65, frontBulge: 0.02 },
      { y: 0.74, radiusX: 0.88, radiusZ: 0.62 },
      { y: 0.94, radiusX: 0.8, radiusZ: 0.54 },
      { y: 0.98, radiusX: 0.72, radiusZ: 0.46 }
    ], 58, 0.76);
    addPart(torsoGeometry, [0, 0.86, 0], [1, 1, 1], [0, 0, 0], torsoMaterial);
    addPart(roundedBox(1.64, 0.38, 1.04, 0.14, 5), [0, -0.34, 0], [1, 1, 1], [0, 0, 0], limbMaterial);
    addPart(roundedBox(0.34, 0.48, 0.72, 0.12, 5), [0, -0.67, 0.02], [1, 1, 1], [0, 0, 0], limbMaterial);

    const makeArm = side => {
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.91, 1.46, 0),
        new THREE.Vector3(side * 1.09, 1.03, 0.01),
        new THREE.Vector3(side * 1.16, 0.38, 0.015),
        new THREE.Vector3(side * 1.14, -0.25, 0.02)
      ]);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(path, 30, 0.23, 18, false), limbMaterial);
      arm.castShadow = true;
      arm.receiveShadow = true;
      bear.add(arm);
      addPart(new THREE.SphereGeometry(0.28, 32, 22), [side * 0.92, 1.43, 0], [1, 1.12, 1.28], [0, 0, 0], limbMaterial);
    };
    makeArm(-1);
    makeArm(1);

    const makeHandGeometry = () => {
      const outerRadius = 0.37;
      const innerRadius = 0.17;
      const startAngle = Math.PI * 0.28;
      const endAngle = Math.PI * 1.72;
      const handShape = new THREE.Shape();
      handShape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
      handShape.lineTo(Math.cos(endAngle) * innerRadius, Math.sin(endAngle) * innerRadius);
      handShape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
      handShape.closePath();
      const geometry = new THREE.ExtrudeGeometry(handShape, {
        depth: 0.32,
        steps: 1,
        curveSegments: 28,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: 0.045,
        bevelThickness: 0.045
      });
      geometry.center();
      return geometry;
    };
    const leftHand = addPart(makeHandGeometry(), [-1.15, -0.56, 0.06], [1, 1, 1], [0, 0, 0.08], limbMaterial);
    const rightHand = addPart(makeHandGeometry(), [1.15, -0.56, 0.06], [-1, 1, 1], [0, 0, 0.08], limbMaterial);
    leftHand.renderOrder = 1;
    rightHand.renderOrder = 1;

    [-0.43, 0.43].forEach(x => {
      addPart(roundedBox(0.72, 1.92, 0.88, 0.2, 5), [x, -1.63, 0], [1, 1, 1], [0, 0, 0], limbMaterial);
      addPart(roundedBox(0.78, 0.5, 1.04, 0.24, 5), [x, -2.55, 0.13], [1, 1, 1], [0, 0, 0], limbMaterial);
      addPart(new THREE.SphereGeometry(0.34, 40, 24), [x, -2.49, 0.47], [1, 0.53, 1.08], [0, 0, 0], headMaterial);
    });

    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 1024;
    brandCanvas.height = 256;
    const brandContext = brandCanvas.getContext('2d');
    brandContext.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
    brandContext.fillStyle = '#fff';
    brandContext.textAlign = 'center';
    brandContext.textBaseline = 'middle';
    brandContext.font = '600 86px Prata, Georgia, serif';
    brandContext.fillText('NEBO BISTRO', 512, 128, 930);
    const brandMask = new THREE.CanvasTexture(brandCanvas);
    brandMask.colorSpace = THREE.SRGBColorSpace;
    brandMask.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const brandMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uMask: { value: brandMask }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform sampler2D uMask;uniform float uTime;varying vec2 vUv;void main(){float a=texture2D(uMask,vUv).a;float wave=.5+.5*sin((vUv.x*1.25+vUv.y*.22-uTime*.16)*6.28318);float sweep=pow(max(0.,cos((vUv.x-uTime*.12)*6.28318)),20.);vec3 obsidian=vec3(.025,.018,.012);vec3 darkGold=vec3(.34,.19,.045);vec3 gold=vec3(1.,.77,.28);vec3 color=mix(obsidian,darkGold,.38+.42*wave);color=mix(color,gold,.38+.52*sweep);gl_FragColor=vec4(color,a);}'
    });
    const brand = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.42), brandMaterial);
    brand.position.set(0, 0.92, 0.71);
    brand.renderOrder = 6;
    bear.add(brand);

    const contactShadowCanvas = document.createElement('canvas');
    contactShadowCanvas.width = 256;
    contactShadowCanvas.height = 128;
    const contactContext = contactShadowCanvas.getContext('2d');
    const paintFootShadow = centerX => {
      const gradient = contactContext.createRadialGradient(centerX, 64, 3, centerX, 64, 38);
      gradient.addColorStop(0, 'rgba(0,0,0,.42)');
      gradient.addColorStop(0.52, 'rgba(0,0,0,.2)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      contactContext.fillStyle = gradient;
      contactContext.fillRect(centerX - 44, 18, 88, 92);
    };
    paintFootShadow(83);
    paintFootShadow(173);
    const contactShadowTexture = new THREE.CanvasTexture(contactShadowCanvas);
    const contactShadowRig = new THREE.Group();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.25, 0.78),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -2.805, 0.04);
    contactShadow.renderOrder = -2;
    contactShadowRig.add(contactShadow);
    scene.add(contactShadowRig);

    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 4.2),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.13, transparent: true, depthWrite: false })
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.set(0, -2.82, 0.08);
    shadowFloor.receiveShadow = true;
    shadowFloor.renderOrder = -3;
    scene.add(shadowFloor);

    const studioRig = new THREE.Group();
    const studioTarget = new THREE.Object3D();
    studioTarget.position.set(0, 0.45, 0);
    studioRig.add(studioTarget);
    studioRig.add(new THREE.HemisphereLight(0xd4e1f7, 0x100c0a, 0.13));

    const keyLight = new THREE.DirectionalLight(0xffdfb8, 0.85);
    keyLight.position.set(4.5, 7, 6);
    keyLight.target = studioTarget;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(isCompactViewport ? 1024 : 2048, isCompactViewport ? 1024 : 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -2.35;
    keyLight.shadow.camera.right = 2.35;
    keyLight.shadow.camera.top = 4.55;
    keyLight.shadow.camera.bottom = -3.05;
    keyLight.shadow.bias = -0.00018;
    keyLight.shadow.normalBias = 0.014;
    keyLight.shadow.camera.updateProjectionMatrix();
    studioRig.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x82a7e0, 0.22);
    fillLight.position.set(-5, 2, 4);
    fillLight.target = studioTarget;
    studioRig.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xfff1da, 0.58);
    rimLight.position.set(2, 5, -5);
    rimLight.target = studioTarget;
    studioRig.add(rimLight);
    scene.add(studioRig);

    let rotation = 0;
    let rotationTarget = 0;
    let tiltTarget = 0;
    let pointerId = null;
    let gesture = null;
    let startX = 0;
    let startY = 0;
    let startRotation = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let spinVelocity = 0;
    let sceneVisible = true;
    let pageVisible = !document.hidden;
    let animationFrame = null;
    let lastFrameTime = performance.now();
    let lastPaintTime = 0;
    let announcedAngle = null;

    const normalizeRotation = value => {
      const normalized = ((value + 180) % 360 + 360) % 360 - 180;
      return normalized === -180 ? 180 : normalized;
    };
    const updateAria = () => {
      const rounded = Math.round(normalizeRotation(rotationTarget));
      if (rounded === announcedAngle) return;
      announcedAngle = rounded;
      const view = Math.abs(rounded) > 145 ? 'Вид сзади' : Math.abs(rounded) < 12 ? 'Вид спереди' : `${Math.abs(rounded)} градусов ${rounded < 0 ? 'влево' : 'вправо'}`;
      heroMascotControl.setAttribute('aria-label', `Интерактивная 3D-модель мишки NEBO Bistro. ${view}.`);
    };

    const finishGesture = event => {
      if (pointerId === null || (event && event.pointerId !== pointerId)) return;
      const releasedId = pointerId;
      const wasRotating = gesture === 'rotate';
      const cancelled = event?.type === 'pointercancel' || event?.type === 'lostpointercapture' || event?.cancelled;
      pointerId = null;
      gesture = null;
      if (wasRotating && !cancelled && !reduceMotion.matches) spinVelocity = THREE.MathUtils.clamp(velocity * 1000, -360, 360);
      else spinVelocity = 0;
      tiltTarget = 0;
      heroMascot.classList.remove('is-dragging');
      if (heroMascotControl.hasPointerCapture?.(releasedId)) heroMascotControl.releasePointerCapture(releasedId);
      velocity = 0;
      scheduleRender(true);
    };

    heroMascotControl.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (pointerId !== null) return;
      pointerId = event.pointerId;
      gesture = null;
      startX = lastX = event.clientX;
      startY = event.clientY;
      startRotation = rotationTarget;
      lastTime = performance.now();
      velocity = 0;
      spinVelocity = 0;
      scheduleRender(true);
    });

    heroMascotControl.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) return finishGesture(event);
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!gesture && Math.hypot(deltaX, deltaY) > 14) {
        gesture = Math.abs(deltaX) > Math.abs(deltaY) * 1.35 ? 'rotate' : 'scroll';
        if (gesture === 'rotate') {
          heroMascot.classList.add('is-dragging');
          heroMascot.style.setProperty('--mascot-x', '0px');
          heroMascot.style.setProperty('--mascot-y', '0px');
          heroMascotControl.setPointerCapture?.(event.pointerId);
        } else return finishGesture({ pointerId: event.pointerId, cancelled: true });
      }
      if (gesture !== 'rotate') return;
      event.preventDefault();
      const now = performance.now();
      const elapsed = Math.max(8, now - lastTime);
      const instantVelocity = ((event.clientX - lastX) / elapsed) * 0.55;
      velocity = velocity * 0.55 + instantVelocity * 0.45;
      lastX = event.clientX;
      lastTime = now;
      rotationTarget = startRotation + deltaX * 0.55;
      tiltTarget = reduceMotion.matches ? 0 : THREE.MathUtils.clamp(deltaY * -0.00125, -0.06, 0.06);
      updateAria();
      scheduleRender(true);
    });

    heroMascotControl.addEventListener('pointerup', finishGesture);
    heroMascotControl.addEventListener('pointercancel', finishGesture);
    window.addEventListener('pointerup', finishGesture);
    window.addEventListener('pointercancel', finishGesture);
    heroMascotControl.addEventListener('lostpointercapture', event => {
      if (pointerId !== null) finishGesture(event);
    });

    turnButtons.forEach(button => button.addEventListener('click', () => {
      spinVelocity = 0;
      rotationTarget += Number(button.dataset.bearStep || 0);
      tiltTarget = 0;
      updateAria();
      scheduleRender(true);
    }));

    heroMascotControl.addEventListener('dblclick', () => {
      spinVelocity = 0;
      rotationTarget = Math.round(rotationTarget / 360) * 360;
      tiltTarget = 0;
      updateAria();
      scheduleRender(true);
    });

    heroMascotControl.addEventListener('keydown', event => {
      const step = event.shiftKey ? 45 : 20;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        spinVelocity = 0;
        rotationTarget += event.key === 'ArrowLeft' ? -step : step;
        tiltTarget = 0;
        updateAria();
        scheduleRender(true);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        spinVelocity = 0;
        rotationTarget = Math.round(rotationTarget / 360) * 360;
        tiltTarget = 0;
        updateAria();
        scheduleRender(true);
      }
    });

    const bearBounds = new THREE.Box3().setFromObject(bear);
    const bearSize = bearBounds.getSize(new THREE.Vector3());
    const bearCenter = bearBounds.getCenter(new THREE.Vector3());

    const resizeScene = () => {
      const width = Math.max(1, heroMascot.clientWidth);
      const height = Math.max(1, heroMascot.clientHeight);
      const compactViewport = window.matchMedia('(max-width: 720px)').matches;
      const nextPixelRatio = Math.min(window.devicePixelRatio || 1, compactViewport ? 1.25 : 1.65);
      if (compactViewport !== isCompactViewport) {
        isCompactViewport = compactViewport;
        keyLight.shadow.mapSize.set(isCompactViewport ? 1024 : 2048, isCompactViewport ? 1024 : 2048);
        if (keyLight.shadow.map) {
          keyLight.shadow.map.dispose();
          keyLight.shadow.map = null;
        }
      }
      if (Math.abs(nextPixelRatio - appliedPixelRatio) > 0.01) {
        appliedPixelRatio = nextPixelRatio;
        renderer.setPixelRatio(appliedPixelRatio);
      }
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const heightDistance = (bearSize.y / 2) / Math.tan(verticalFov / 2);
      const yawSafeWidth = Math.hypot(bearSize.x, bearSize.z);
      const widthDistance = (yawSafeWidth / 2) / Math.tan(horizontalFov / 2);
      const padding = camera.aspect < 0.7 ? 1.085 : 1.12;
      const distance = Math.max(heightDistance, widthDistance) * padding + bearSize.z * 0.16;
      const focusY = bearCenter.y - 0.04;
      camera.position.set(0, focusY, distance);
      camera.lookAt(0, focusY, 0);
      camera.updateProjectionMatrix();
      scheduleRender(true);
    };

    const stopRenderLoop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    const needsFastFrames = () => gesture === 'rotate' || Math.abs(rotationTarget - rotation) > 0.025 || (!reduceMotion.matches && Math.abs(spinVelocity) > 0.08) || Math.abs(tiltTarget - bear.rotation.x) > 0.0005;

    function scheduleRender(immediate = false) {
      if (!sceneVisible || !pageVisible || animationFrame !== null) return;
      if (immediate || needsFastFrames() || !reduceMotion.matches) animationFrame = requestAnimationFrame(renderScene);
    }

    const resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(heroMascot);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        sceneVisible = entries[0]?.isIntersecting ?? true;
        if (sceneVisible) {
          lastFrameTime = performance.now();
          scheduleRender(true);
        } else stopRenderLoop();
      }, { threshold: 0.01 }).observe(heroMascot);
    }

    document.addEventListener('visibilitychange', () => {
      pageVisible = !document.hidden;
      if (pageVisible) {
        lastFrameTime = performance.now();
        scheduleRender(true);
      } else stopRenderLoop();
    });

    reduceMotion.addEventListener?.('change', () => {
      spinVelocity = 0;
      tiltTarget = 0;
      bear.rotation.x = 0;
      scheduleRender(true);
    });

    const cancelPointerInteraction = () => {
      if (pointerId !== null) finishGesture({ pointerId, type: 'pointercancel' });
    };
    window.addEventListener('blur', cancelPointerInteraction);
    window.addEventListener('pagehide', cancelPointerInteraction);

    heroMascotControl.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      stopRenderLoop();
      heroMascot.classList.add('is-3d-unavailable');
      setBearInteractivity(false);
    });

    heroMascotControl.addEventListener('webglcontextrestored', () => {
      rebuildEnvironment();
      heroMascot.classList.remove('is-3d-unavailable');
      setBearInteractivity(false);
      lastFrameTime = performance.now();
      scheduleRender(true);
    });

    function renderScene(time) {
      animationFrame = null;
      if (!sceneVisible || !pageVisible) return;
      if (!needsFastFrames() && !reduceMotion.matches && time - lastPaintTime < 32) {
        animationFrame = requestAnimationFrame(renderScene);
        return;
      }
      lastPaintTime = time;
      const delta = Math.min(0.05, Math.max(1 / 240, (time - lastFrameTime) / 1000));
      lastFrameTime = time;

      if (pointerId === null && !reduceMotion.matches && Math.abs(spinVelocity) > 0.08) {
        rotationTarget += spinVelocity * delta;
        spinVelocity *= Math.exp(-4.8 * delta);
        if (Math.abs(spinVelocity) < 0.08) {
          spinVelocity = 0;
          updateAria();
        }
      }

      rotation = reduceMotion.matches ? rotationTarget : THREE.MathUtils.damp(rotation, rotationTarget, 8.6, delta);
      bear.rotation.y = THREE.MathUtils.degToRad(rotation);
      bear.rotation.x = reduceMotion.matches ? 0 : THREE.MathUtils.damp(bear.rotation.x, tiltTarget, 10, delta);
      studioRig.rotation.copy(bear.rotation);
      studioRig.position.copy(bear.position);
      if (scene.environmentRotation) scene.environmentRotation.copy(bear.rotation);
      brandMaterial.uniforms.uTime.value = reduceMotion.matches ? 0 : time * 0.001;
      contactShadowRig.rotation.y = bear.rotation.y;
      renderer.render(scene, camera);
      if (!heroMascot.classList.contains('is-3d-ready')) setBearInteractivity(true);

      if (Math.abs(rotation) > 720 && Math.abs(rotationTarget - rotation) < 0.05 && spinVelocity === 0) {
        const turns = Math.trunc(rotation / 360);
        rotation -= turns * 360;
        rotationTarget -= turns * 360;
      }
      scheduleRender();
    }

    resizeScene();
    updateAria();
    scheduleRender(true);
  } catch (error) {
    heroMascot.classList.add('is-3d-unavailable');
    setBearInteractivity(false);
    console.warn('Production 3D mascot could not be initialized.', error);
  }
}

initBear3D();

const siteHeader = document.querySelector('[data-site-header]');
const footer = document.querySelector('[data-footer]');
const modalCard = modal?.querySelector('.modal-card');
const desktopNavQuery = window.matchMedia('(min-width: 921px)');
let activeTrigger = null;
let navTrigger = null;
let modalScrollY = 0;

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const pageRegions = [...document.querySelectorAll('main, .site-header, .footer, .mobile-nav, .mobile-book')];

function setPageInert(value, exceptions = []) {
  pageRegions.forEach(region => {
    if (exceptions.includes(region)) return;
    region.inert = value;
  });
}

function syncBodyLock() {
  const overlayOpen = modal?.classList.contains('open') || mobileNav?.classList.contains('open');
  document.body.classList.toggle('lock', Boolean(overlayOpen));
}

function closeNav(restoreFocus = true) {
  if (!mobileNav?.classList.contains('open')) return;
  mobileNav.classList.remove('open');
  mobileNav.setAttribute('aria-hidden', 'true');
  mobileNav.inert = true;
  menuToggle?.setAttribute('aria-expanded', 'false');
  [document.querySelector('main'), siteHeader, footer, mobileBook].filter(Boolean).forEach(region => { region.inert = false; });
  syncBodyLock();
  if (restoreFocus) navTrigger?.focus({ preventScroll: true });
}

function openNav() {
  if (!mobileNav || !menuToggle) return;
  navTrigger = document.activeElement;
  mobileNav.inert = false;
  mobileNav.classList.add('open');
  mobileNav.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  [document.querySelector('main'), siteHeader, footer, mobileBook].filter(Boolean).forEach(region => { region.inert = true; });
  syncBodyLock();
  navClose?.focus({ preventScroll: true });
}

function openModal(room = '', trigger = document.activeElement) {
  if (!modal || !bookingCopy || !modalCard) return;
  const requestedTrigger = trigger instanceof HTMLElement ? trigger : null;
  const restoreToMenuToggle = Boolean(requestedTrigger && mobileNav?.contains(requestedTrigger));
  if (mobileNav?.classList.contains('open')) closeNav(false);
  activeTrigger = restoreToMenuToggle ? menuToggle : requestedTrigger;
  bookingCopy.textContent = room
    ? `Уточним свободное время для «${room}» и поможем с деталями бронирования.`
    : 'Позвоните или напишите. Уточним свободное время и поможем выбрать стол.';
  modalScrollY = window.scrollY;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  setPageInert(true);
  modal.inert = false;
  syncBodyLock();
  modalCard.focus({ preventScroll: true });
}

function closeModal(restoreFocus = true) {
  if (!modal?.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  setPageInert(false);
  mobileNav.inert = true;
  syncBodyLock();
  window.scrollTo({ top: modalScrollY, behavior: 'instant' });
  if (restoreFocus) activeTrigger?.focus({ preventScroll: true });
  activeTrigger = null;
}

document.querySelectorAll('[data-book]').forEach(button => {
  button.addEventListener('click', () => openModal(button.dataset.room || '', button));
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal()));
menuToggle?.addEventListener('click', openNav);
navClose?.addEventListener('click', () => closeNav());
mobileNav?.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => closeNav(false)));
desktopNavQuery.addEventListener?.('change', event => { if (event.matches) closeNav(false); });

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (modal?.classList.contains('open')) return closeModal();
    if (mobileNav?.classList.contains('open')) closeNav();
  }

  const trap = modal?.classList.contains('open') ? modalCard : mobileNav?.classList.contains('open') ? mobileNav : null;
  if (event.key !== 'Tab' || !trap) return;
  const focusable = [...trap.querySelectorAll(focusableSelector)].filter(element => !element.hidden && element.getClientRects().length);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const menuData = {
  main: {
    kicker: 'Основное меню',
    title: 'Азия.<br>Море. Огонь.',
    description: 'Сашими, роллы, морепродукты, вок и робата. Выразительные сочетания и точная работа с продуктом.',
    image: 'https://neborest.com/wp-content/uploads/2022/12/IMG_9043-scaled.jpg',
    alt: 'Морепродукты и зелень из основного меню NEBO',
    label: 'Смотреть основное меню',
    index: '01 / 03',
    href: 'https://neborest.com/wp-content/uploads/2026/03/Основное-меню_небо_печать.pdf'
  },
  wine: {
    kicker: 'Винная карта',
    title: 'Вино<br>к моменту',
    description: 'От выразительных игристых до глубоких красных. Вина, которые продолжают вкус блюд NEBO.',
    image: 'https://neborest.com/wp-content/uploads/2024/03/MG_7895-HDR-2-scaled.jpg',
    alt: 'Вечерняя сервировка и атмосфера винной карты NEBO',
    label: 'Смотреть винную карту',
    index: '02 / 03',
    href: 'https://neborest.com/wp-content/uploads/2026/06/Винная-карта_Небо_печать.pdf'
  },
  special: {
    kicker: 'Сезонное предложение',
    title: 'Сейчас<br>в NEBO',
    description: 'Короткое меню из продуктов в лучшей форме. Специальные блюда доступны ограниченное время.',
    image: 'assets/special-dessert.webp',
    alt: 'Ванильный мусс с малиной и шоколадом. Иллюстрация для прототипа меню.',
    label: 'Смотреть предложение',
    index: '03 / 03',
    href: 'https://neborest.com/wp-content/uploads/2026/03/Special-весна-26-НЕБО.pdf'
  }
};

const menuShowcase = document.querySelector('.menu-showcase');
const menuPhoto = document.querySelector('#menu-photo');
const menuContent = document.querySelector('#menu-content');
const menuTabs = [...document.querySelectorAll('.menu-tab')];
let menuSwitchTimer;

function activateMenuTab(tab, moveFocus = false) {
  const data = menuData[tab?.dataset.menu];
  if (!data || !menuShowcase || !menuPhoto || !menuContent) return;
  menuTabs.forEach(item => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  menuContent.setAttribute('aria-labelledby', tab.id);
  if (moveFocus) tab.focus();

  window.clearTimeout(menuSwitchTimer);
  menuShowcase.classList.add('is-switching');
  menuSwitchTimer = window.setTimeout(() => {
    document.querySelector('#menu-kicker').textContent = data.kicker;
    document.querySelector('#menu-title').innerHTML = data.title;
    document.querySelector('#menu-description').textContent = data.description;
    document.querySelector('#menu-index').textContent = data.index;
    const link = document.querySelector('#menu-link');
    link.href = data.href;
    link.firstChild.textContent = data.label;
    menuPhoto.src = data.image;
    menuPhoto.alt = data.alt;
    menuShowcase.dataset.menu = tab.dataset.menu;
    requestAnimationFrame(() => requestAnimationFrame(() => menuShowcase.classList.remove('is-switching')));
  }, reduceMotion.matches ? 0 : 180);
}

menuTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateMenuTab(tab));
  tab.addEventListener('keydown', event => {
    let targetIndex = null;
    if (event.key === 'ArrowRight') targetIndex = (index + 1) % menuTabs.length;
    if (event.key === 'ArrowLeft') targetIndex = (index - 1 + menuTabs.length) % menuTabs.length;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = menuTabs.length - 1;
    if (targetIndex === null) return;
    event.preventDefault();
    activateMenuTab(menuTabs[targetIndex], true);
  });
});

const revealElements = [...document.querySelectorAll('.reveal')];
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  revealElements.forEach(element => revealObserver.observe(element));
  window.setTimeout(() => {
    revealElements.forEach(element => {
      element.classList.add('visible');
      revealObserver.unobserve(element);
    });
  }, 2200);
}

const spacesGrid = document.querySelector('.spaces-grid');
const spacesCurrent = document.querySelector('#spaces-current');
if (spacesGrid && spacesCurrent) {
  const cards = [...spacesGrid.querySelectorAll('.space-card')];
  let currentIndex = 0;
  let scrollFrame = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerStartScroll = 0;
  let pointerId = null;
  let isPointerDragging = false;
  let dragEndedAt = 0;

  const updateActiveSpace = () => {
    const gridRect = spacesGrid.getBoundingClientRect();
    const targetX = gridRect.left + gridRect.width / 2;
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const currentDistance = Math.abs(cardRect.left + cardRect.width / 2 - targetX);
      if (currentDistance < distance) { distance = currentDistance; nearest = index; }
    });
    currentIndex = nearest;
    cards.forEach((card, index) => card.classList.toggle('is-current', index === nearest));
    spacesCurrent.textContent = String(nearest + 1).padStart(2, '0');
  };

  const goToSpace = index => {
    currentIndex = (index + cards.length) % cards.length;
    const card = cards[currentIndex];
    const targetLeft = card.offsetLeft - (spacesGrid.clientWidth - card.offsetWidth) / 2;
    spacesGrid.scrollTo({ left: targetLeft, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  };

  document.querySelector('[data-spaces-prev]')?.addEventListener('click', () => goToSpace(currentIndex - 1));
  document.querySelector('[data-spaces-next]')?.addEventListener('click', () => goToSpace(currentIndex + 1));
  spacesGrid.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    goToSpace(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  spacesGrid.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateActiveSpace);
  }, { passive: true });

  if (finePointer.matches) spacesGrid.classList.add('is-pointer-ready');
  finePointer.addEventListener?.('change', event => {
    spacesGrid.classList.toggle('is-pointer-ready', event.matches);
  });

  spacesGrid.addEventListener('pointerdown', event => {
    if (!finePointer.matches || event.button !== 0 || event.target.closest('button, a')) return;
    pointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerStartScroll = spacesGrid.scrollLeft;
    isPointerDragging = false;
  });

  spacesGrid.addEventListener('pointermove', event => {
    if (pointerId !== event.pointerId) return;
    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;
    if (!isPointerDragging) {
      if (Math.abs(deltaX) < 7) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) {
        pointerId = null;
        return;
      }
      isPointerDragging = true;
      spacesGrid.classList.add('is-dragging');
      spacesGrid.setPointerCapture?.(event.pointerId);
    }
    event.preventDefault();
    spacesGrid.scrollLeft = pointerStartScroll - deltaX;
  });

  const finishPointerDrag = event => {
    if (pointerId !== event.pointerId) return;
    if (isPointerDragging) {
      updateActiveSpace();
      spacesGrid.classList.remove('is-dragging');
      spacesGrid.releasePointerCapture?.(event.pointerId);
      dragEndedAt = performance.now();
      goToSpace(currentIndex);
    }
    pointerId = null;
    isPointerDragging = false;
  };

  spacesGrid.addEventListener('pointerup', finishPointerDrag);
  spacesGrid.addEventListener('pointercancel', finishPointerDrag);
  spacesGrid.addEventListener('click', event => {
    if (performance.now() - dragEndedAt > 250) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  updateActiveSpace();
}

let scrollFrame = null;
function updateViewportState() {
  scrollFrame = null;
  siteHeader?.classList.toggle('scrolled', window.scrollY > 28);
  if (!mobileBook || !hero) return;
  const heroRect = hero.getBoundingClientRect();
  const afterHero = heroRect.bottom <= Math.max(96, window.innerHeight * .12);
  const footerNear = footer && footer.getBoundingClientRect().top < window.innerHeight + 80;
  const overlayOpen = modal?.classList.contains('open') || mobileNav?.classList.contains('open');
  const visibleBookingAction = [...document.querySelectorAll('[data-book]:not(.mobile-book)')].some(action => {
    if (action.closest('.mobile-nav, .modal')) return false;
    const style = window.getComputedStyle(action);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = action.getBoundingClientRect();
    return rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight;
  });
  mobileBook.classList.toggle('visible', afterHero);
  mobileBook.classList.toggle('is-obscured', Boolean(footerNear || overlayOpen || visibleBookingAction));
}

function requestViewportState() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(updateViewportState);
}
window.addEventListener('scroll', requestViewportState, { passive: true });
window.addEventListener('resize', requestViewportState, { passive: true });
updateViewportState();
