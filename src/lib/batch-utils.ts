import { layerCount } from './stl-utils';

export interface PlateResult {
  fits: boolean;
  motivo?: 'area' | 'altura';
  capacidade: number;
  rotacionado: boolean;
}

export function plateCapacity({
  dimX,
  dimY,
  dimZ,
  bedX,
  bedY,
  bedZ,
  margin,
  gap
}: {
  dimX: number;
  dimY: number;
  dimZ: number;
  bedX: number;
  bedY: number;
  bedZ: number;
  margin: number;
  gap: number;
}): PlateResult {
  if (dimZ > bedZ) return { fits: false, motivo: 'altura', capacidade: 0, rotacionado: false };

  const usableX = bedX - 2 * margin;
  const usableY = bedY - 2 * margin;

  if (usableX <= 0 || usableY <= 0) return { fits: false, motivo: 'area', capacidade: 0, rotacionado: false };

  const capA_X = Math.floor((usableX + gap) / (dimX + gap));
  const capA_Y = Math.floor((usableY + gap) / (dimY + gap));
  const capA = Math.max(0, capA_X * capA_Y);

  const capB_X = Math.floor((usableX + gap) / (dimY + gap));
  const capB_Y = Math.floor((usableY + gap) / (dimX + gap));
  const capB = Math.max(0, capB_X * capB_Y);

  const capacidade = Math.max(capA, capB);

  if (capacidade < 1) return { fits: false, motivo: 'area', capacidade: 0, rotacionado: false };

  return {
    fits: true,
    capacidade,
    rotacionado: capB > capA
  };
}

export function plateTimeHours({
  n,
  volumeExtrudadoMm3,
  dimZ,
  layerHeight,
  volumetricRate,
  travelSeg,
  calibracao,
  modo
}: {
  n: number;
  volumeExtrudadoMm3: number;
  dimZ: number;
  layerHeight: number;
  volumetricRate: number;
  travelSeg: number;
  calibracao: number;
  modo: 'simultaneo' | 'sequencial';
}): number {
  if (n <= 0) return 0;
  const L = layerCount(dimZ, layerHeight);

  let s = 0;
  if (modo === 'sequencial') {
    s = n * (volumeExtrudadoMm3 / volumetricRate + L * 4) + 240;
  } else {
    const extrusao = (n * volumeExtrudadoMm3) / volumetricRate;
    const camadas = L * (4 + (n - 1) * travelSeg);
    s = extrusao + camadas + 240;
  }

  return ((s / 3600) * calibracao);
}

export interface BatchTimeInfo {
  fixo: number;
  variavel: number;
  exato: boolean;
  aviso?: string;
}

/**
 * PARTE B.1 - splitPlateTime
 * Separa o tempo da placa em parte FIXA e VARIÁVEL
 */
export function splitPlateTime({ 
  plateHours, 
  piecesPerPlate, 
  singleHours, 
  fixedShare 
}: {
  plateHours: number;
  piecesPerPlate: number;
  singleHours?: number;
  fixedShare: number;
}): BatchTimeInfo {
  if (piecesPerPlate <= 1) {
    return { fixo: plateHours, variavel: 0, exato: true };
  }

  // Caso (a): Cálculo EXATO se singleHours informado e coerente
  if (singleHours && singleHours > 0 && piecesPerPlate > 1) {
    const variavel = (plateHours - singleHours) / (piecesPerPlate - 1);
    const fixo = singleHours - variavel;

    if (fixo >= 0 && variavel > 0) {
      return { fixo, variavel, exato: true };
    }
    
    // Fallback se incoerente
    const fall = splitPlateTime({ plateHours, piecesPerPlate, fixedShare });
    return { 
      ...fall, 
      aviso: "Os tempos informados não batem — conferindo pelo modo aproximado" 
    };
  }

  // Caso (b): APROXIMADO
  const fixo = plateHours * (fixedShare || 0.15);
  const variavel = (plateHours - fixo) / piecesPerPlate;
  return { fixo, variavel, exato: false };
}

/**
 * PARTE B.2 - plateTimeFor(k) = fixo + k * variavel
 */
export function plateTimeFor(k: number, { fixo, variavel }: { fixo: number, variavel: number }): number {
  if (k <= 0) return 0;
  return fixo + k * variavel;
}

/**
 * PARTE B.3 - batchPlan
 */
export function batchPlan({ 
  totalPieces, 
  piecesPerPlate, 
  plateHours, 
  singleHours,
  fixedShare 
}: {
  totalPieces: number;
  piecesPerPlate: number;
  plateHours: number;
  singleHours?: number;
  fixedShare: number;
}) {
  const n = Math.max(1, piecesPerPlate);
  const total = Math.max(1, totalPieces);
  
  const placasCheias = Math.floor(total / n);
  const resto = total % n;
  const placasTotal = placasCheias + (resto > 0 ? 1 : 0);
  
  const timeInfo = splitPlateTime({ plateHours, piecesPerPlate: n, singleHours, fixedShare });
  
  const horasParcial = resto > 0 ? plateTimeFor(resto, timeInfo) : 0;
  const horasTotal = placasCheias * plateHours + horasParcial;
  const horasPorPeca = total > 0 ? horasTotal / total : 0;

  return {
    placasCheias,
    resto,
    placasTotal,
    horasParcial,
    horasTotal,
    horasPorPeca,
    ...timeInfo
  };
}

export function plateRisk({
  n,
  failurePct,
  modo,
  killsPlate,
  lossFactor
}: {
  n: number;
  failurePct: number;
  modo: 'simultaneo' | 'sequencial';
  killsPlate: boolean;
  lossFactor: number;
}) {
  const p = failurePct / 100;
  if (modo === 'simultaneo' && killsPlate) {
    const pMesa = 1 - Math.pow(1 - p, n);
    return { multiplicador: 1 + pMesa * lossFactor, pMesa };
  } else {
    return { multiplicador: 1 + p, pMesa: p };
  }
}

export function calcBatch(params: any) {
  const {
    quantidade,
    n, // pieces_per_plate
    modo,
    volumeExtrudadoMm3,
    pesoG,
    pesoSuporteG,
    plateWasteG,
    precoKg,
    watts,
    precoKwh,
    precoHoraMaquina,
    setupMinutes,
    precoHoraMaoObra,
    posMinutos,
    precoHoraPos,
    embalagem,
    failurePct,
    killsPlate,
    lossFactor,
    marginPct,
    discountPct,
    taxPct,
    platformFeePct,
    
    // V3 specific
    plateTimeHoursInput,
    singleTimeHoursInput,
    fixedTimeShare,
    weightInputMode // 'peca' | 'placa'
  } = params;

  // Calculamos o plano de lote
  const plan = batchPlan({
    totalPieces: quantidade,
    piecesPerPlate: n,
    plateHours: plateTimeHoursInput,
    singleHours: singleTimeHoursInput,
    fixedShare: fixedTimeShare
  });

  // Peso unitário dependendo do modo de entrada
  const unitWeightG = weightInputMode === 'placa' ? pesoG / n : pesoG;
  const unitSupportG = weightInputMode === 'placa' ? pesoSuporteG / n : pesoSuporteG;

  const calculateMesa = (k: number) => {
    if (k <= 0) return { total: 0, tempo: 0, material: 0 };
    
    // Usamos plateTimeFor em vez da estimativa geométrica
    const tempoMesa = plateTimeFor(k, plan);

    // Material da mesa: k peças + desperdício da placa
    const materialG = k * (unitWeightG + unitSupportG) + plateWasteG;
    const custoMat = (materialG / 1000) * precoKg;
    const custoEnergia = (watts / 1000) * tempoMesa * precoKwh;
    const custoMaquina = tempoMesa * precoHoraMaquina;
    const custoSetup = (setupMinutes / 60) * precoHoraMaoObra;

    const risco = plateRisk({
      n: k,
      failurePct,
      modo,
      killsPlate,
      lossFactor
    }).multiplicador;

    const custoBaseMesa = (custoMat + custoEnergia + custoMaquina + custoSetup) * risco;
    const custoPos = k * (posMinutos / 60) * precoHoraPos;
    const custoFinalMesa = custoBaseMesa + custoPos + k * embalagem;

    return {
      total: custoFinalMesa,
      tempo: tempoMesa,
      material: materialG,
      baseCost: (custoMat + custoEnergia + custoMaquina + custoSetup + custoPos + k * embalagem)
    };
  };

  const mesaCheiaResult = calculateMesa(n);
  const mesaRestoResult = calculateMesa(plan.resto);

  const totalBaseCost = (plan.placasCheias * mesaCheiaResult.total) + mesaRestoResult.total;
  const totalTime = plan.horasTotal;
  
  // Gross-up logic
  const precoTabela = totalBaseCost * (1 + marginPct / 100);
  const precoComDesconto = precoTabela * (1 - discountPct / 100);
  const divisor = Math.max(0.05, 1 - (taxPct / 100) - (platformFeePct / 100));
  
  const finalPrice = precoComDesconto / divisor;
  const unitPrice = finalPrice / quantidade;
  const unitCost = totalBaseCost / quantidade;

  return {
    ...plan,
    finalPrice,
    unitPrice,
    unitCost,
    totalTime,
    mesasCheias: plan.placasCheias,
    totalPlates: plan.placasTotal,
    mesaCheiaResult,
    mesaRestoResult
  };
}
