import { useMediaQuery } from "react-responsive";

/**
 * Whether this screen has room for a turned, tilted map.
 *
 * Turning the map is a two-handed, look-around-the-scene sort of gesture, and a
 * tilted map costs vertical space: at 45° the far half of it piles into a
 * strip. On a phone that leaves nothing to play on, so the feature is offered
 * at tablet size and up and is absent — not merely hidden — below it.
 *
 * Width alone would not do. A phone held sideways is wider than a tablet held
 * upright (932 px on a 14 Pro Max, against 768) and would qualify on width
 * while being 430 px tall. Asking for both dimensions is what separates the
 * two, in either orientation.
 *
 * A media query rather than the user agent on purpose: apps/game/src/lib/
 * helpers/isDevice matches /iPad/ and would throw tablets out with the phones,
 * and iPadOS has called itself a Macintosh since 13 anyway. The question here
 * is how much screen there is, which is the thing a media query answers.
 */

/**
 * Wide enough for the smaller tablets held upright — an iPad mini is 744 CSS
 * pixels across and an 8" Android around 600, so a stricter 768 would have
 * turned the feature on and off as those were rotated.
 */
export const ROTATE_MIN_WIDTH = 600;
/**
 * And tall enough not to be a phone lying on its side, which is where a rule
 * about width alone falls down: those reach 900 across but only around 430 up.
 */
export const ROTATE_MIN_HEIGHT = 500;

export function useCanRotate(): boolean {
  return useMediaQuery({
    minWidth: ROTATE_MIN_WIDTH,
    minHeight: ROTATE_MIN_HEIGHT,
  });
}
