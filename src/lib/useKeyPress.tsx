import { useState, useEffect } from "react";

export function useKeyPress(targetKey: string) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState<boolean>(false);
  // Add event listeners
  useEffect(() => {
    // If pressed key is our target key then set to true
    const downHandler = (e: KeyboardEvent) => {
      if (e.key === targetKey) {
        setKeyPressed(true);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // If released key is our target key then set to false
    const upHandler = (e: KeyboardEvent) => {
      if (e.key === targetKey) {
        setKeyPressed(false);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [targetKey]); // Empty array ensures that effect is only run on mount and unmount
  return keyPressed;
}
