
/* eslint-disable react/no-unknown-property */
import React from "react";
import { Vector3,  } from "@react-three/fiber";
import { easings, useTransition, animated } from "@react-spring/three";

import Flag from "./Flag";
import { ConfigService } from "../../services/configService";


function FlagSelector({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {

  const initialFlagPositionOutsideRight: Vector3 = [10, -0.3, 0.4];
  const initialFlagPositionOutsideLeft: Vector3 = [-20, -0.3, 0.4];
  const flagPosition: Vector3 = [0, -0.3, 0.4];

  // Creamos un hook useTransition para animar la entrada y salida de la bandera antigua
  const transitions = useTransition(flagImageUrl, {
    from: { position: initialFlagPositionOutsideRight },
    enter: { position: flagPosition },
    leave: { position: initialFlagPositionOutsideLeft },
    config: { duration: ConfigService.flagQuizTransitionsTime },
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
