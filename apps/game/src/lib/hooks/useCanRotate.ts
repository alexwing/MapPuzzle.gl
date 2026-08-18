/**
 * Map rotation and 3D tilt are supported on all devices (mobile, tablet, desktop).
 */
export const ROTATE_MIN_WIDTH = 0;
export const ROTATE_MIN_HEIGHT = 0;

export function useCanRotate(): boolean {
  return true;
}
