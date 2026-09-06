import { CELL_COUNT } from "./fluid-response.mjs";
export function magneticCells() {
  const directions = new Float32Array(CELL_COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < CELL_COUNT; i++) {
    const y = 1 - ((i + 0.5) / CELL_COUNT) * 2;
    const radius = Math.sqrt(1 - y * y);
    directions.set(
      [Math.cos(i * golden) * radius, y, Math.sin(i * golden) * radius],
      i * 3,
    );
  }
  return directions;
}
// Bind the nearest three cells once at initialization. The GPU needs only
// three compact polynomial lobes per vertex instead of a 64-cell search.
export function bindSurface(positions, cells) {
  const count = positions.length / 3;
  const owners = new Float32Array(count * 3);
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
    const best = [-2, -2, -2],
      indices = [0, 0, 0];
    for (let cell = 0; cell < CELL_COUNT; cell++) {
      const dot =
        x * cells[cell * 3] + y * cells[cell * 3 + 1] + z * cells[cell * 3 + 2];
      if (dot > best[0]) {
        best[2] = best[1];
        indices[2] = indices[1];
        best[1] = best[0];
        indices[1] = indices[0];
        best[0] = dot;
        indices[0] = cell;
      } else if (dot > best[1]) {
        best[2] = best[1];
        indices[2] = indices[1];
        best[1] = dot;
        indices[1] = cell;
      } else if (dot > best[2]) {
        best[2] = dot;
        indices[2] = cell;
      }
    }
    owners.set(indices, offset);
  }
  return owners;
}
