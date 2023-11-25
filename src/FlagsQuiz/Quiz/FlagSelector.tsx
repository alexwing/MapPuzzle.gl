/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react/no-unknown-property */
import * as THREE from "three";
import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { easings, useSpring } from "@react-spring/core";
import {
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  RepeatWrapping,
  TextureLoader,
} from "three";
import { AlphaColor } from "../../lib/Utils";
import Flag from "./Flag";

extend({ THREE });

const SPEED = 0.003;
const INTENSITY = 0.125;
const TIMEANIMATION = 2000;

const initialFlagPositionOutsideRight: [number, number, number] = [
  20, -0.3, 0.4,
];

const initialFlagPositionOutsideLeft: [number, number, number] = [
  -20, -0.3, 0.4,
];
const flagPosition: [number, number, number] = [0, -0.3, 0.4];
const flagStartPosition: [number, number, number] = flagPosition;
const flagEndPosition: [number, number, number] = flagPosition;

function FlagSelector({ flagImageUrl }: { flagImageUrl: string }): JSX.Element {
  const [newFlagImageUrl, setNewFlagImageUrl] = useState("");
  const [hideFlag, setHideFlag] = useState(false);

  const flagStarAnimation = useSpring({
    flagStartPosition,
    from: { flagStartPosition: initialFlagPositionOutsideRight },
    to: { flagStartPosition: flagPosition },
    config: { duration: TIMEANIMATION, easing: easings.easeOutCubic },
  });
  const startAnimation = () => {
    setNewFlagImageUrl(flagImageUrl);
    flagStarAnimation.flagStartPosition.start({
      from: initialFlagPositionOutsideRight,
      to: flagPosition,
      config: { duration: TIMEANIMATION, easing: easings.easeOutCubic },
      /*onChange: () => { 
        console.log("position changed" + flagInAnimation.flagPosition.get());
      },
      onStart(result, ctrl, item) {
        //console.log("onStart", result, ctrl, item);
      },*/
    });
  };

  const flagEndAnimation = useSpring({
    flagEndPosition,
    from: { flagEndPosition: flagPosition },
    to: { flagEndPosition: initialFlagPositionOutsideLeft },
    config: { flagEndPosition: TIMEANIMATION, easing: easings.easeOutCubic },
  });

  function endAnimation() {
    //setHideFlag(false);
    flagEndAnimation.flagEndPosition.start({
      from: flagPosition,
      to: initialFlagPositionOutsideLeft,
      config: { duration: TIMEANIMATION, easing: easings.easeOutCubic },
      /*onChange: () => {
        console.log("position changed" + flagInAnimation.flagPosition.get());
      },*/
      onRest: () => {
        setNewFlagImageUrl(flagImageUrl);
        //setHideFlag(true);
      },
    });
  }
  useEffect(() => {
    if (newFlagImageUrl !== flagImageUrl && newFlagImageUrl !== "") {
      startAnimation();
      endAnimation();
    } else if (newFlagImageUrl === "") {
      startAnimation();
    }
  }, [flagImageUrl]);

  return (
    <React.Fragment>
      <pointLight position={[10, 10, 1.35]} intensity={7} />
      <ambientLight intensity={0.05} />
      {newFlagImageUrl !== "" && !hideFlag && (
        <group position={flagEndAnimation.flagEndPosition.get()}>
          <Flag flagImageUrl={newFlagImageUrl} />
        </group>
      )}
      {flagImageUrl !== "" && (
        <group position={flagStarAnimation.flagStartPosition.get()}>
          <Flag flagImageUrl={flagImageUrl} />
        </group>
      )}
    </React.Fragment>
  );
}

export default FlagSelector;
