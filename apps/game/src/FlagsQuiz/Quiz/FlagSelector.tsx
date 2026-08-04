
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

  // create a useTransition hook to animate the entry and exit of the old flag
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
        // Use the animated component to render the old flag with the animated transition
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
