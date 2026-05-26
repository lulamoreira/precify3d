export interface STLData {
  volCm3: number;
  dimX: number;
  dimY: number;
  dimZ: number;
  hasOH: boolean;
  hasBridge: boolean;
  isTall: boolean;
  count: number;
}

export function getMaterialDensity(name: string): number {
  const map: Record<string, number> = {
    'PLA': 1.24,
    'ABS': 1.04,
    'PETG': 1.27,
    'TPU': 1.21,
    'Silk': 1.24,
    'Resina': 1.12,
    'Nylon': 1.14,
    'ASA': 1.07
  };
  
  const upperName = name.toUpperCase();
  for (const [key, val] of Object.entries(map)) {
    if (upperName.includes(key.toUpperCase())) return val;
  }
  return 1.24;
}

export function calcWeightFromSTL(volCm3: number, density: number, infillPct: number): number {
  const weight = volCm3 * density * (0.30 + 0.70 * (infillPct / 100));
  return parseFloat(weight.toFixed(1));
}

export function parseSTLBuffer(buffer: ArrayBuffer): { n: number[]; v1: number[]; v2: number[]; v3: number[] }[] {
  const view = new DataView(buffer);
  const count = view.getUint32(80, true);
  
  if (buffer.byteLength === 84 + count * 50) {
    return parseBinarySTL(view, count);
  }
  
  return parseASCIISTL(new TextDecoder().decode(buffer));
}

function parseBinarySTL(view: DataView, count: number) {
  const tris = [];
  for (let i = 0; i < count; i++) {
    const off = 84 + i * 50;
    tris.push({
      n: [view.getFloat32(off, true), view.getFloat32(off + 4, true), view.getFloat32(off + 8, true)],
      v1: [view.getFloat32(off + 12, true), view.getFloat32(off + 16, true), view.getFloat32(off + 20, true)],
      v2: [view.getFloat32(off + 24, true), view.getFloat32(off + 28, true), view.getFloat32(off + 32, true)],
      v3: [view.getFloat32(off + 36, true), view.getFloat32(off + 40, true), view.getFloat32(off + 44, true)]
    });
  }
  return tris;
}

function parseASCIISTL(text: string) {
  const lines = text.split('\n');
  const tris = [];
  let currentTri: any = {};
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('facet normal')) {
      currentTri.n = line.split(/\s+/).slice(2).map(Number);
    } else if (line.startsWith('vertex')) {
      const v = line.split(/\s+/).slice(1).map(Number);
      if (!currentTri.v1) currentTri.v1 = v;
      else if (!currentTri.v2) currentTri.v2 = v;
      else currentTri.v3 = v;
    } else if (line.startsWith('endfacet')) {
      tris.push(currentTri);
      currentTri = {};
    }
  }
  return tris;
}

export function analyzeTriangles(tris: any[]): STLData {
  let vol = 0;
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  let hasOH = false;
  let hasBridge = false;

  for (const t of tris) {
    // Signed volume of tetrahedron
    vol += (t.v1[0] * (t.v2[1] * t.v3[2] - t.v2[2] * t.v3[1]) +
            t.v1[1] * (t.v2[2] * t.v3[0] - t.v2[0] * t.v3[2]) +
            t.v1[2] * (t.v2[0] * t.v3[1] - t.v2[1] * t.v3[0])) / 6;

    for (const v of [t.v1, t.v2, t.v3]) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], v[i]);
        max[i] = Math.max(max[i], v[i]);
      }
    }

    if (t.n) {
      const nz = t.n[2];
      const angle = Math.asin(Math.abs(nz)) * 180 / Math.PI;
      if (nz < -0.001) {
        if (angle < 45) hasOH = true;
        if (angle < 10) hasBridge = true;
      }
    }
  }

  const dimX = max[0] - min[0];
  const dimY = max[1] - min[1];
  const dimZ = max[2] - min[2];

  return {
    volCm3: Math.abs(vol) / 1000,
    dimX, dimY, dimZ,
    hasOH, hasBridge,
    isTall: dimZ > 100,
    count: tris.length
  };
}
