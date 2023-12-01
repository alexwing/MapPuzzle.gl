/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react/no-unknown-property */
import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { useFrame, extend } from "@react-three/fiber";

extend({ THREE });

const SPEED = 0.003;
const INTENSITY = 0.125;

function Flag({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {

  const flagRef = useRef<THREE.Mesh>(null);
  const flagFakeShadow = useRef<THREE.Mesh>(null);

  // Load flag texture and apply it to the flag mesh
  useEffect(() => {
    if (flagRef.current) {
      const loader = new THREE.TextureLoader();
      loader.load(
        flagImageUrl,
        (texture) => {
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.95,
            metalness: 3,
          });
          flagRef.current!.material = material;
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
        }
      );
    }
  }, [flagImageUrl]);

  //Create flagFakeShadow texture 
  useEffect(() => {
    if (flagFakeShadow.current) {
      const loader = new THREE.TextureLoader();
      loader.load(
        "./flagQuiz/shadow.png",
        (texture) => {
          //the texture is a png with transparency, so we need to set the transparent flag to true
          const material = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4,
          });
          flagFakeShadow.current!.material = material;
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
        }
      );
    }
  }, []);

  // Animate flag vertices
  useFrame(() => {
    const time = Date.now() * SPEED; // Cambia el factor para ajustar la velocidad del movimiento

    if (flagRef.current) {
      const flag = flagRef.current;
      const flagFakeShadowMesh = flagFakeShadow.current;
      const flagGeometry = flag.geometry;
      const flagVertices = flagGeometry.attributes.position.array;

      // Ondula los vértices de la bandera
      for (let i = -3; i < flagVertices.length; i += 3) {
        flagVertices[i + 5] = Math.sin(i * INTENSITY + time) * INTENSITY;
      }

      flagGeometry.attributes.position.needsUpdate = true;
      if (flagFakeShadowMesh) flagFakeShadowMesh.geometry = flagGeometry;
    }
  });
  
  return (
    <React.Fragment>
      <group  rotation={[0,0, 0]} position={[0, 0, 0]}>
        <mesh ref={flagRef}>
          <planeGeometry args={[8, 5, 32, 32]} />
        </mesh>
        <mesh
          ref={flagFakeShadow}
          position={[-0.2, -0.1, -0.18]}
          scale={[1.15, 1.15, 1]}
        >
          <planeGeometry args={[8, 5, 32, 32]} />
        </mesh>

        <mesh position={[-4.15, -1.2, 0.1]}>
          <cylinderGeometry args={[0.12, 0.12, 8, 32]} />
          <meshStandardMaterial
            color={"#000000"}
            transparent={true}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[-4.15, 2.8, 0.1]} name="poleTop">
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshPhongMaterial color={"#FFD700"} />
        </mesh>
         <mesh position={[-4, 2.5, 0]} rotation={[0, 0, 1]} name="halyardTop">
          <planeGeometry args={[0.05, 0.25, 1, 1]} />
          <meshPhongMaterial
            color={"#000000"}
            opacity={0.5}
            transparent={true}
          />
        </mesh>
        <mesh
          position={[-4, -2.5, 0]}
          rotation={[0, 0, -1]}
          name="halyardBottom"
        >
          <planeGeometry args={[0.05, 0.25, 1, 1]} />
          <meshPhongMaterial
            color={"#000000"}
            opacity={0.5}
            transparent={true}
          />
        </mesh>
        
      </group>
    </React.Fragment>
  );
}

export default Flag;
