/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react/no-unknown-property */
import * as THREE from "three";
import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import {
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  RepeatWrapping,
  TextureLoader,
} from "three";
import { AlphaColor } from "../../lib/Utils";

extend({ THREE });

const SPEED = 0.003;
const INTENSITY = 0.125;

function Flag({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {
  const { size } = useThree();
  const [camera] = useState(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
  );

  const flagRef = useRef<THREE.Mesh>(null);
  const flagFakeShadow = useRef<THREE.Mesh>(null);

  const scene = useThree((state) => state.scene);
const renderer = useThree((state) => state.gl);

  useLayoutEffect(() => {
    camera.left = -size.width / 2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = -size.height / 2;
    camera.position.set(0, 0, 100);
    camera.updateProjectionMatrix();
  }, [size]);

  useEffect(() => {
    if (flagRef.current) {
        //createBackground();
      const loader = new THREE.TextureLoader();
      loader.load(
        flagImageUrl,
        (texture) => {
          const material = new THREE.MeshPhongMaterial({ map: texture , side: THREE.DoubleSide});
          flagRef.current!.material = material;
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
        }
      );
    }
  }, [flagImageUrl]);

  //Create flagFakeShadow  texture from url background "http://localhost:3000/flagQuiz/shadow.png"
    useEffect(() => {
        if (flagFakeShadow.current) {
        const loader = new THREE.TextureLoader();
        loader.load(
            "http://localhost:3000/flagQuiz/shadow.png",
            (texture) => {
                //the texture is a png with transparency, so we need to set the transparent flag to true
            const material = new THREE.MeshPhongMaterial({ map: texture , side: THREE.DoubleSide, transparent: true, opacity: 0.4});    
            flagFakeShadow.current!.material = material;
            },
            undefined,
            (error) => {
            console.error("Error loading texture:", error);
            }
        );
        }
    }, []);

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
/*
  const createBackground = () => {
    // Load the image
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load("http://localhost:3000/flagQuiz/flagBackground3.jpeg");

    // Repeat the texture to create a tiled effect
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(5, 5); // Adjust these values to change the tiling effect
    //set texture to center of plane
    texture.center.set(0.5, 0.5);

    // Create a plane geometry for the background
    const planeGeometry = new PlaneGeometry(100, 100); // Adjust these values to change the size of the plane

    // Create a material with the texture and apply it to the plane
    const planeMaterial = new MeshBasicMaterial({ map: texture });
    const plane = new Mesh(planeGeometry, planeMaterial);

    // Position the plane and add it to the scene
    plane.position.set(0, 0, -8); // Adjust these values to change the position of the plane
    scene.add(plane);
    // Enable shadows on the renderer, the plane, and the flag
    renderer.shadowMap.enabled = true;
    plane.receiveShadow = true;
    const flag = flagRef.current;

    if (flag) flag.castShadow = true;

  };
*/
  return (
    <React.Fragment>
      <pointLight position={[10, 10, 0.25]} intensity={10} />
      <ambientLight intensity={0.1} />
      <mesh ref={flagRef}>
        <planeGeometry args={[8, 5, 32, 32]} />
      </mesh>
      <mesh ref={flagFakeShadow} position={[0.5, -0.4, -0.5]} scale={[1.15, 1.15, 1]}>
        <planeGeometry args={[8, 5, 32, 32]} />
      </mesh>


      <mesh position={[-4.15, -1.2, 0.1]}>
        <cylinderGeometry args={[0.12, 0.12, 8, 32]} /> 
        <meshStandardMaterial color={'#000000'}  transparent={true} roughness={0.5} metalness={0.1} />
     </mesh>
        <mesh position={[-4.15, 2.8, 0.1]}>
            <sphereGeometry args={[0.25, 32, 32]} /> 
            <meshStandardMaterial color={'#FFD700'} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[-4.8, 3, -1]} rotation={[1.35,0,0]}>
        <planeGeometry args={[0.1, 1, 32, 32]} />
        <meshStandardMaterial color={'#000000'} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[-4.8, 5, -1]} rotation={[1.35,0,0]}>
        <planeGeometry args={[0.1, 1, 32, 32]} />
        <meshStandardMaterial color={'#000000'} roughness={0.5} metalness={0.1} />
        </mesh>

    </React.Fragment>
  );
}

export default Flag;
