export interface PricingInput {
  // Common
  weightG: number;
  timeHours: number;
  materialPricePerKg: number;
  kwhPrice: number;
  printerWatts: number;
  laborPricePerHour: number;
  machinePricePerHour: number;
  failurePct: number;
  marginPct: number;
  discountPct: number;
  packagingPrice: number;
  platformFeePct: number;
  
  // V2 Specific
  quantity?: number;
  taxPct?: number;
  setupMinutes?: number;
  postProcessingPriceHour?: number;
  postProcessingMinutes?: number;
}

export interface PricingResult {
  costMaterial: number;
  costEnergy: number;
  costLabor: number;
  costMachine: number;
  costSetup: number;
  costPost: number;
  subtotal: number;
  
  taxValue: number;
  platformFeeValue: number;
  marginValue: number;
  discountValue: number;
  
  finalPrice: number;
  finalPriceUnit: number;
  profit: number;
  profitUnit: number;
  
  realMarginPct: number;
  breakEvenPrice: number;
  
  weightEff: number;
  isLoss: boolean;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const {
    weightG, timeHours, materialPricePerKg, kwhPrice, printerWatts,
    laborPricePerHour, machinePricePerHour, failurePct, marginPct,
    discountPct, packagingPrice, platformFeePct
  } = input;

  const weightEff = weightG * (1 + failurePct / 100);
  const costMaterial = (weightEff / 1000) * materialPricePerKg;
  const costEnergy = (printerWatts / 1000) * timeHours * kwhPrice;
  const costLabor = timeHours * laborPricePerHour;
  const costMachine = timeHours * machinePricePerHour;
  
  const subtotal = costMaterial + costEnergy + costLabor + costMachine + packagingPrice;
  const marginValue = subtotal * (marginPct / 100);
  const platformFeeValue = (subtotal + marginValue) * (platformFeePct / 100);
  const discountValue = (subtotal + marginValue + platformFeeValue) * (discountPct / 100);
  
  const finalPrice = subtotal + marginValue + platformFeeValue - discountValue;
  const profit = marginValue - discountValue;

  return {
    costMaterial,
    costEnergy,
    costLabor,
    costMachine,
    costSetup: 0,
    costPost: 0,
    subtotal,
    taxValue: 0,
    marginValue,
    platformFeeValue,
    discountValue,
    finalPrice,
    finalPriceUnit: finalPrice,
    profit,
    profitUnit: profit,
    realMarginPct: marginPct,
    breakEvenPrice: subtotal,
    weightEff,
    isLoss: profit < 0
  };
}

/**
 * V2 Pricing Engine
 * Uses Gross-up logic: taxes and platform fees are calculated over the FINAL price.
 */
export function calculatePricingV2(input: PricingInput): PricingResult {
  const {
    weightG, timeHours, materialPricePerKg, kwhPrice, printerWatts,
    laborPricePerHour, machinePricePerHour, failurePct, marginPct,
    discountPct, packagingPrice, platformFeePct,
    quantity = 1, taxPct = 0, setupMinutes = 15,
    postProcessingPriceHour = 0, postProcessingMinutes = 0
  } = input;

  // 1. Direct Costs (Variable) com fator de falha aplicado a energia e máquina (0.2)
  const riskFactor = (1 + failurePct / 100);
  const weightEff = weightG * riskFactor;
  const costMaterial = (weightEff / 1000) * materialPricePerKg;
  const costEnergy = ((printerWatts / 1000) * timeHours * kwhPrice) * riskFactor;
  const costMachine = (timeHours * machinePricePerHour) * riskFactor;
  
  // 2. Labor Costs (Não aplica falha no pós-processamento)
  const costLabor = timeHours * laborPricePerHour;
  const costSetup = (setupMinutes / 60) * laborPricePerHour;
  const costPost = (postProcessingMinutes / 60) * postProcessingPriceHour;
  
  // 3. Base Cost per Unit
  const totalBaseCost = (costMaterial + costEnergy + costMachine + costLabor + costPost + packagingPrice) * quantity + costSetup;

  /**
   * 4. Gross-up Calculation (0.1 CORREÇÃO: Desconto fora do divisor)
   * Formula: FinalPrice = (BaseCost * (1 + Margin) * (1 - Discount)) / (1 - Tax - PlatformFee)
   */
  const precoTabela = totalBaseCost * (1 + marginPct / 100);
  const precoComDesconto = precoTabela * (1 - discountPct / 100);
  
  const divisor = 1 - (taxPct / 100) - (platformFeePct / 100);
  
  // Safety check
  if (divisor <= 0.05) {
    throw new Error('Taxa + imposto somam 95% ou mais');
  }
  
  const finalPrice = precoComDesconto / divisor;
  const finalPriceUnit = finalPrice / quantity;

  // 5. Deductions from Final Price
  const discountValue = precoTabela - precoComDesconto;
  const taxValue = finalPrice * (taxPct / 100);
  const platformFeeValue = finalPrice * (platformFeePct / 100);
  
  // 6. Final Results
  const profit = finalPrice - totalBaseCost - taxValue - platformFeeValue;
  const profitUnit = profit / quantity;
  
  // Real Margin: Profit / Final Price
  const realMarginPct = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
  
  // Break Even: BaseCost / Divisor
  const breakEvenPrice = totalBaseCost / divisor;

  return {
    costMaterial: costMaterial * quantity,
    costEnergy: costEnergy * quantity,
    costLabor: costLabor * quantity,
    costMachine: costMachine * quantity,
    costSetup,
    costPost: costPost * quantity,
    subtotal: totalBaseCost,
    taxValue,
    platformFeeValue,
    marginValue: precoTabela - totalBaseCost, 
    discountValue,
    finalPrice,
    finalPriceUnit,
    profit,
    profitUnit,
    realMarginPct,
    breakEvenPrice,
    weightEff: weightEff * quantity,
    isLoss: profit < 0
  };
}
