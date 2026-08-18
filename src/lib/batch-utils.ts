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

  // Usando (usable + gap) / (dim + gap) para considerar que a última peça não precisa de gap
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
    n,
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
    dimZ,
    layerHeight,
    volumetricRate,
    travelSeg,
    calibracao,
    failurePct,
    killsPlate,
    lossFactor,
    marginPct,
    discountPct,
    taxPct,
    platformFeePct
  } = params;

  const mesasCheias = Math.floor(quantidade / n);
  const resto = quantidade % n;

  const calculateMesa = (k: number) => {
    if (k <= 0) return { total: 0, tempo: 0, material: 0 };
    
    const tempoMesa = plateTimeHours({
      n: k,
      volumeExtrudadoMm3,
      dimZ,
      layerHeight,
      volumetricRate,
      travelSeg: modo === 'simultaneo' ? travelSeg : 0,
      calibracao,
      modo
    });

    const materialG = k * (pesoG + pesoSuporteG) + plateWasteG;
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
      baseCost: (custoMat + custoEnergia + custoMaquina + custoSetup + custoPos + k * embalagem) // para referência
    };
  };

  const mesaCheiaResult = calculateMesa(n);
  const mesaRestoResult = calculateMesa(resto);

  const totalBaseCost = (mesasCheias * mesaCheiaResult.total) + mesaRestoResult.total;
  const totalTime = (mesasCheias * mesaCheiaResult.tempo) + mesaRestoResult.tempo;
  
  // Gross-up logic corrected (Parte 0.1)
  const precoTabela = totalBaseCost * (1 + marginPct / 100);
  const precoComDesconto = precoTabela * (1 - discountPct / 100);
  const divisor = Math.max(0.05, 1 - (taxPct / 100) - (platformFeePct / 100));
  
  const finalPrice = precoComDesconto / divisor;
  const unitPrice = finalPrice / quantidade;
  const unitCost = totalBaseCost / quantidade;

  return {
    finalPrice,
    unitPrice,
    unitCost,
    totalTime,
    mesasCheias,
    resto,
    totalPlates: mesasCheias + (resto > 0 ? 1 : 0),
    mesaCheiaResult,
    mesaRestoResult
  };
}
