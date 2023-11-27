
/* eslint-disable react/no-unknown-property */
import React, { useState, useEffect } from "react";
import { Vector3, extend } from "@react-three/fiber";
import { easings, useSpring, useTransition, animated } from "@react-spring/three";

import Flag from "./Flag";


function FlagSelector({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {
  const TIMEANIMATION = 1000;
  const initialFlagPositionOutsideRight: Vector3 = [10, -0.3, 0.4];
  const initialFlagPositionOutsideLeft: Vector3 = [-20, -0.3, 0.4];
  const flagPosition: Vector3 = [0, -0.3, 0.4];

  // Creamos un hook useTransition para animar la entrada y salida de la bandera antigua
  const transitions = useTransition(flagImageUrl, {
    from: { position: initialFlagPositionOutsideRight },
    enter: { position: flagPosition },
    leave: { position: initialFlagPositionOutsideLeft },
    config: { duration: TIMEANIMATION },
    easing: easings.easeOutCubic, 
  });

  return (
    <React.Fragment>
 
      {transitions((style, item) => {
        // Usamos el componente animated para renderizar la bandera antigua con la transición animada
        return (
          item && (
            <animated.group position={style.position}>
              <Flag flagImageUrl={item} />
            </animated.group>
          )
        );
      })}
    </React.Fragment>
  );
}

export default FlagSelector;
