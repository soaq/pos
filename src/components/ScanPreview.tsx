"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type PreviewItem = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Props = {
  coverage: number;
  equipment: PreviewItem[];
  recording: boolean;
};

export function ScanPreview({ coverage, equipment, recording }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const host = hostRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x17130f);

    const camera = new THREE.PerspectiveCamera(52, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(4.8, 4.2, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xfff2d2, 0x1f2527, 2.1);
    scene.add(light);
    scene.add(new THREE.GridHelper(8, 16, 0xb98135, 0x3a3329));

    const group = new THREE.Group();
    scene.add(group);

    const pointsGeometry = new THREE.BufferGeometry();
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xf2c078,
      size: 0.035,
      transparent: true,
      opacity: 0.88,
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    pointsRef.current = points;
    groupRef.current = group;

    let frame = 0;
    let animation = 0;

    const resize = () => {
      if (!hostRef.current) return;
      camera.aspect = hostRef.current.clientWidth / hostRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(hostRef.current.clientWidth, hostRef.current.clientHeight);
    };

    const animate = () => {
      frame += 0.01;
      group.rotation.y = Math.sin(frame) * 0.08;
      points.rotation.y += recording ? 0.004 : 0.001;
      renderer.render(scene, camera);
      animation = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [recording]);

  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;

    const count = Math.max(80, Math.round(coverage * 8));
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399963;
      const radius = 0.25 + ((i % 55) / 55) * 3.6;
      const height = ((i * 17) % 120) / 120;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height * 2.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    points.geometry.computeBoundingSphere();
  }, [coverage]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.clear();
    equipment.forEach((item) => {
      const geometry = new THREE.BoxGeometry(item.w / 95, 0.5, item.h / 95);
      const material = new THREE.MeshStandardMaterial({
        color: item.id === "range" ? 0xd8542f : 0x51606a,
        roughness: 0.72,
        metalness: 0.22,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((item.x - 240) / 90, 0.25, (item.y - 210) / 90);
      group.add(mesh);
    });
  }, [equipment]);

  return (
    <div className="scanPreview">
      <div ref={hostRef} className="scanCanvas" />
      <div className="scanBadge">{coverage}% coverage</div>
    </div>
  );
}
