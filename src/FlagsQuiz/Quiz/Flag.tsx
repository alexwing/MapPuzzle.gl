/* eslint-disable react/no-unknown-property */
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from 'react-three-fiber';
import * as THREE from 'three';

function Flag({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {
  const flagRef = useRef<THREE.Mesh>();

  useEffect(() => {
    // Crear la geometría de la bandera
    const geometry = new THREE.PlaneGeometry(1, 1, 32, 32); // Aumentamos la resolución de la geometría

    // Modificar los vértices de la geometría para la forma deseada
    // Por ejemplo, para una bandera ondulada
    const positionAttribute = geometry.getAttribute('position');
    const vertices = positionAttribute.array as number[];
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = Math.sin(x * 2 + y * 3) * 0.1;
      vertices[i + 2] = z;
    }
    positionAttribute.needsUpdate = true;

    // Crear el material de la bandera
    const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(flagImageUrl) });

    // Crear la malla de la bandera y asignarla a la referencia
    const mesh = new THREE.Mesh(geometry, material);
    flagRef.current = mesh;
  }, [flagImageUrl]);


  return (
    <React.Fragment>
      <ambientLight />
      <directionalLight position={[0, 10, 0]} intensity={1} />
      <primitive object={flagRef} />
    </React.Fragment>
  );
}

export default Flag;
