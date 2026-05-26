export interface PricingInput {
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
}

export interface PricingResult {
  costMaterial: number;
  costEnergy: number;
  costLabor: number;
  costMachine: number;
  subtotal: number;
  marginValue: number;
  platformFeeValue: number;
  discountValue: number;
  finalPrice: number;
  profit: number;
  weightEff: number;
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
    subtotal,
    marginValue,
    platformFeeValue,
    discountValue,
    finalPrice,
    profit,
    weightEff
  };
}
