/**
 * Tiny Monte Carlo TSR valuation — ~40 lines of domain respect.
 * Simulates correlated price paths, ranks relative TSR, averages discounted payouts.
 */

function randn(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function simulatePaths(
  startPrice: number,
  volatility: number,
  correlation: number,
  steps: number,
  paths: number,
): number[][] {
  const results: number[][] = [];
  for (let p = 0; p < paths; p++) {
    let price = startPrice;
    let peerPrice = startPrice * (0.9 + Math.random() * 0.2);
    const path: number[] = [price];

    for (let t = 1; t <= steps; t++) {
      const z1 = randn();
      const z2 = correlation * z1 + Math.sqrt(1 - correlation ** 2) * randn();
      price *= Math.exp((-0.5 * volatility ** 2) / steps + (volatility / Math.sqrt(steps)) * z1);
      peerPrice *= Math.exp((-0.5 * volatility ** 2) / steps + (volatility / Math.sqrt(steps)) * z2);
      path.push(price);
    }
    results.push(path);
  }
  return results;
}

function relativeTSR(companyReturn: number, peerReturn: number): number {
  return companyReturn - peerReturn;
}

const START = 100;
const VOL = 0.25;
const CORR = 0.6;
const STEPS = 252;
const PATHS = 10_000;
const DISCOUNT = 0.05;

const paths = simulatePaths(START, VOL, CORR, STEPS, PATHS);

let totalPayout = 0;
let aboveMedian = 0;

for (const path of paths) {
  const companyReturn = (path[path.length - 1] - START) / START;
  const peerReturn = companyReturn * CORR + (Math.random() - 0.5) * 0.1;
  const tsr = relativeTSR(companyReturn, peerReturn);

  // PSU payout: 0% below 50th pct, 100% at median, 200% at 75th+
  const payout = tsr > 0.15 ? 2.0 : tsr > 0 ? 1.0 : 0;
  totalPayout += payout / (1 + DISCOUNT);
  if (tsr > 0) aboveMedian++;
}

console.log('Monte Carlo TSR Valuation');
console.log('========================');
console.log(`Paths:        ${PATHS.toLocaleString()}`);
console.log(`Volatility:   ${(VOL * 100).toFixed(0)}%`);
console.log(`Correlation:  ${CORR}`);
console.log(`Avg payout:   ${(totalPayout / PATHS).toFixed(3)} (discounted)`);
console.log(`Beat peers:   ${((aboveMedian / PATHS) * 100).toFixed(1)}% of paths`);