    /* eslint-disable react/no-unknown-property */
    import * as THREE from "three";
    import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
    import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";

    extend({ THREE });

    function Flag({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {
    const {
        gl,
        scene: defaultScene,
        camera: defaultCamera,
        size,
        events,
    } = useThree();
    const [scene] = useState(() => new THREE.Scene());
    const [camera] = useState(
        () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
    );

    const flagRef = useRef<THREE.Mesh>();

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
        const loader = new THREE.TextureLoader();
        loader.load(flagImageUrl, (texture) => {
            console.log("Texture loaded:", texture);
            const material = new THREE.MeshPhongMaterial({ map: texture });
            flagRef.current!.material = material;
        }, undefined, (error) => {
            console.error("Error loading texture:", error);
        });
        }
    }, [flagImageUrl]);

    useFrame(() => {
        const time = Date.now() * 0.003; // Cambia el factor para ajustar la velocidad del movimiento
    
        if (flagRef.current) {
          const flag = flagRef.current;
          const flagGeometry = flag.geometry;
          const flagVertices = flagGeometry.attributes.position.array;
    
          // Ondula los vértices de la bandera
          for (let i = 0; i < flagVertices.length; i += 3) {
            const y = Math.sin(i * 0.125 + time) * 0.125;
            flagVertices[i + 5] = y;
          }
    
          flagGeometry.attributes.position.needsUpdate = true;
        }
      });
    

    return (
        <React.Fragment>
        <pointLight position={[1, 1, 1]} />
        <mesh ref={flagRef}>
            <planeGeometry args={[8, 5, 32, 32]} />
        </mesh>
        </React.Fragment>
    );
    }

    export default Flag;
