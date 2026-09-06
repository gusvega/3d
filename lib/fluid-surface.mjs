import { CELL_COUNT } from "./fluid-response.mjs";
export function magneticCells() {
  const directions = new Float32Array(CELL_COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < CELL_COUNT; i++) {
    const y = 1 - ((i + 0.5) / CELL_COUNT) * 2;
    const radius = Math.sqrt(1 - y * y);
    // Deterministic irregular spacing: no polar rows or repeated rosette.
    const x = Math.cos(i * golden) * radius + 0.04 * Math.sin(i * 17.13);
    const z = Math.sin(i * golden) * radius + 0.04 * Math.cos(i * 11.71);
    const yy = y + 0.035 * Math.sin(i * 7.37);
    const length = Math.hypot(x, yy, z);
    directions.set([x / length, yy / length, z / length], i * 3);
  }
  return directions;
}
// Bind the nearest four cells once at initialization. The GPU needs only
// four compact polynomial lobes per vertex instead of a full cell search.
export function bindSurface(positions, cells) {
  const count = positions.length / 3;
  const owners = new Float32Array(count * 4);
  for (let vertex = 0; vertex < count; vertex++) {
    const offset = vertex * 3;
    const length = Math.hypot(
      positions[offset],
      positions[offset + 1],
      positions[offset + 2],
    );
    const x = positions[offset] / length,
      y = positions[offset + 1] / length,
      z = positions[offset + 2] / length;
    const best = [-2, -2, -2, -2],
      indices = [0, 0, 0, 0];
    for (let cell = 0; cell < CELL_COUNT; cell++) {
      const dot =
        x * cells[cell * 3] + y * cells[cell * 3 + 1] + z * cells[cell * 3 + 2];
      for (let slot = 0; slot < 4; slot++) {
        if (dot > best[slot]) {
          for (let move = 3; move > slot; move--) {
            best[move] = best[move - 1];
            indices[move] = indices[move - 1];
          }
          best[slot] = dot;
          indices[slot] = cell;
          break;
        }
      }
    }
    owners.set(indices, vertex * 4);
  }
  return owners;
}
