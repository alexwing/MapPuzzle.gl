/**
 * Contracts shared by the game client, the editor client and the backend.
 *
 * Type-only for now, so importing this costs nothing at runtime and neither
 * side needs the other's source tree. Keep it that way unless a genuinely
 * shared implementation lands here: the backend resolves this package through
 * tsconfig paths, which erased type imports do not need at runtime.
 */

export * from "./models";
export * from "./sql";
export * from "./domain";
