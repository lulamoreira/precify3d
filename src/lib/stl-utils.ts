export interface STLData {
  volCm3: number;
  areaCm2: number;
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
  // V1 Fallback
  const weight = volCm3 * density * (0.30 + 0.70 * (infillPct / 100));
  return parseFloat(weight.toFixed(1));
}

export function layerCount(dimZ: number, layerHeight: number): number {
  return Math.max(1, Math.ceil(dimZ / layerHeight));
}

/**
 * V2 Weight Estimation (0.4 CORREÇÃO: Clamp em shellVol e retorno de objeto)
 */
export function estimateWeightV2(data: STLData, density: number, infillPct: number, walls: number = 3, layerHeight: number = 0.2, nozzleWidth: number = 0.4): { pesoG: number, pesoSuporteG: number, volumeExtrudadoMm3: number } {
  const areaMm2 = data.areaCm2 * 100;
  const volMm3 = data.volCm3 * 1000;
  
  // Shell volume estimate: Area * Wall thickness com CLAMP (0.4)
  const wallThickness = walls * nozzleWidth;
  const shellVol = Math.min(areaMm2 * wallThickness, volMm3 * 0.95);
  
  // Remaining internal volume for infill
  const internalVol = Math.max(0, volMm3 - shellVol);
  const volumeExtrudadoMm3 = shellVol + internalVol * (infillPct / 100);
  
  // Total weight in grams
  const pesoG = (volumeExtrudadoMm3 / 1000) * density;
  
  // Add weight for supports (0.4 CORREÇÃO: pesoSuporteG separado)
  const volumeSuporteMm3 = data.hasOH ? volMm3 * 0.10 * 0.15 : 0;
  const pesoSuporteG = (volumeSuporteMm3 / 1000) * density;
  
  return { 
    pesoG: parseFloat(pesoG.toFixed(1)), 
    pesoSuporteG: parseFloat(pesoSuporteG.toFixed(1)),
    volumeExtrudadoMm3: parseFloat(volumeExtrudadoMm3.toFixed(1))
  };
}

/**
 * V2 Time Estimation (0.3 CORREÇÃO: Considera altura dimZ)
 * Based on volumetric flow rate (mm3/s)
 */
export function estimateTimeHours({ 
  volumeExtrudadoMm3, 
  dimZ, 
  layerHeight = 0.2, 
  volumetricRate = 8, 
  calibration = 1.0 
}: {
  volumeExtrudadoMm3: number;
  dimZ: number;
  layerHeight?: number;
  volumetricRate?: number;
  calibration?: number;
}): number {
  if (volumetricRate <= 0 || layerHeight <= 0) return 0;
  
  const tempoExtrusaoS = volumeExtrudadoMm3 / volumetricRate;
  const numCamadas = layerCount(dimZ, layerHeight);
  const tempoCamadasS = numCamadas * 4; // troca de camada + deslocamento
  const aquecimentoS = 240; // uma vez por impressão
  
  const horas = ((tempoExtrusaoS + tempoCamadasS + aquecimentoS) / 3600) * calibration;
  return parseFloat(horas.toFixed(2));
}

export function parseSTLBuffer(buffer: ArrayBuffer): { n: number[]; v1: number[]; v2: number[]; v3: number[] }[] {
  const view = new DataView(buffer);
  
  // Check if it's binary or ASCII
  if (buffer.byteLength < 84) {
    return parseASCIISTL(new TextDecoder().decode(buffer));
  }
  
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
      if (currentTri.v1 && currentTri.v2 && currentTri.v3) {
        tris.push(currentTri);
      }
      currentTri = {};
    }
  }
  return tris;
}

export function analyzeTriangles(tris: any[]): STLData {
  let vol = 0;
  let area = 0;
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  let hasOH = false;
  let hasBridge = false;

  for (const t of tris) {
    // Signed volume of tetrahedron
    vol += (t.v1[0] * (t.v2[1] * t.v3[2] - t.v2[2] * t.v3[1]) +
            t.v1[1] * (t.v2[2] * t.v3[0] - t.v2[0] * t.v3[2]) +
            t.v1[2] * (t.v2[0] * t.v3[1] - t.v2[1] * t.v3[0])) / 6;

    // Surface Area calculation
    const ax = t.v2[0] - t.v1[0];
    const ay = t.v2[1] - t.v1[1];
    const az = t.v2[2] - t.v1[2];
    const bx = t.v3[0] - t.v1[0];
    const by = t.v3[1] - t.v1[1];
    const bz = t.v3[2] - t.v1[2];
    
    // Cross product components
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    
    // Area of triangle = 0.5 * length of cross product
    area += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);

    for (const v of [t.v1, t.v2, t.v3]) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], v[i]);
        max[i] = Math.max(max[i], v[i]);
      }
    }

    if (t.n) {
      const nz = t.n[2];
      const len = Math.sqrt(t.n[0]**2 + t.n[1]**2 + t.n[2]**2);
      const normalizedNz = len > 0 ? nz / len : nz;
      
      const angle = Math.asin(Math.abs(normalizedNz)) * 180 / Math.PI;
      if (normalizedNz < -0.001) {
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
    areaCm2: area / 100,
    dimX, dimY, dimZ,
    hasOH, hasBridge,
    isTall: dimZ > 100,
    count: tris.length
  };
}

export function parseGCode(text: string): { weightG?: number; timeHours?: number } {
  let weight: number | undefined;
  let time: number | undefined;

  const weightRegex = /filament used \[g\]\s*=\s*([\d.]+)/i;
  const weightMatch = text.match(weightRegex);
  if (weightMatch) weight = parseFloat(weightMatch[1]);
  else {
    const weightRegexCura = /;Filament used:\s*([\d.]+)g/i;
    const weightMatchCura = text.match(weightRegexCura);
    if (weightMatchCura) weight = parseFloat(weightMatchCura[1]);
  }

  const timeCura = text.match(/;TIME:(\d+)/i);
  if (timeCura) time = parseInt(timeCura[1]) / 3600;
  else {
    const timePrusa = text.match(/estimated printing time.*=\s*(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/i);
    if (timePrusa) {
      const h = parseInt(timePrusa[1] || '0');
      const m = parseInt(timePrusa[2] || '0');
      const s = parseInt(timePrusa[3] || '0');
      time = h + m / 60 + s / 3600;
    }
  }

  return { weightG: weight, timeHours: time };
}
