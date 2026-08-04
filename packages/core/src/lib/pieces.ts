/**
 * Presentation helpers for puzzle pieces.
 */

import type { PieceProps } from "@mappuzzle/shared";

/**
 * Returns the class name for a table row based on whether it is selected or not.
 * @param c - A PieceProps object containing information about a table row.
 * @param pieceSelected - The ID of the currently selected table row.
 * @returns The class name as a string.
 */
export function className(c: PieceProps, pieceSelected: number): string {
  return c.properties.cartodb_id === pieceSelected ? "table-primary" : "";
}
