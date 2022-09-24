import React, {useState, useEffect } from "react";


export function useKeyPress(targetKey:any) {
    // State for keeping track of whether key is pressed
    const [keyPressed, setKeyPressed] = useState<boolean>(false);
    // If pressed key is our target key then set to true
    function downHandler(e:any) {
      if (e.key === targetKey) {
        setKeyPressed(true);
        e.preventDefault();
      }
    }
    // If released key is our target key then set to false
    const upHandler = ({ key }:any) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };
    // Add event listeners
    useEffect(() => {
      window.addEventListener("keydown", downHandler);
      window.addEventListener("keyup", upHandler);
      // Remove event listeners on cleanup
      return () => {
        window.removeEventListener("keydown", downHandler);
        window.removeEventListener("keyup", upHandler);
      };
    }, [upHandler,downHandler]); // Empty array ensures that effect is only run on mount and unmount
    return keyPressed;
  }
  
  