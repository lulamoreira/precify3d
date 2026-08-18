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

  // 1. Direct Costs (Variable)
  const weightEff = weightG * (1 + failurePct / 100);
  const costMaterial = (weightEff / 1000) * materialPricePerKg;
  const costEnergy = (printerWatts / 1000) * timeHours * kwhPrice;
  const costMachine = timeHours * machinePricePerHour;
  
  // 2. Labor Costs
  const costLabor = timeHours * laborPricePerHour;
  const costSetup = (setupMinutes / 60) * laborPricePerHour;
  const costPost = (postProcessingMinutes / 60) * postProcessingPriceHour;
  
  // 3. Base Cost per Unit
  const totalBaseCost = (costMaterial + costEnergy + costMachine + costLabor + costPost + packagingPrice) * quantity + costSetup;
  const baseCostPerUnit = totalBaseCost / quantity;

  /**
   * 4. Gross-up Calculation
   * Formula: FinalPrice = BaseCost * (1 + Margin) / (1 - Tax - PlatformFee - Discount)
   * We want the margin to be over the base cost, but taxes/fees over fixed final price.
   */
  const markup = 1 + (marginPct / 100);
  const divisors = 1 - (taxPct / 100) - (platformFeePct / 100) - (discountPct / 100);
  
  // Safety check to avoid division by zero or negative price
  const activeDivisors = divisors > 0.1 ? divisors : 0.1;
  
  const finalPrice = (totalBaseCost * markup) / activeDivisors;
  const finalPriceUnit = finalPrice / quantity;

  // 5. Deductions from Final Price
  const taxValue = finalPrice * (taxPct / 100);
  const platformFeeValue = finalPrice * (platformFeePct / 100);
  const discountValue = finalPrice * (discountPct / 100);
  
  // 6. Final Results
  const profit = finalPrice - totalBaseCost - taxValue - platformFeeValue - discountValue;
  const profitUnit = profit / quantity;
  
  // Real Margin: Profit / Final Price
  const realMarginPct = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
  
  // Break Even: BaseCost / (1 - Tax - Fee)
  const breakEvenPrice = totalBaseCost / (1 - (taxPct / 100) - (platformFeePct / 100));

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
    marginValue: finalPrice - totalBaseCost - taxValue - platformFeeValue, 
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
