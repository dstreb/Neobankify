/**
 * Credit Underwriting Engine
 *
 * Evaluates loan applications using multi-factor scoring.
 * Implements fair lending compliance (ECOA/FCRA).
 * All decisions are auditable with adverse action reasons.
 */

export interface UnderwritingInput {
  creditScore: number;
  annualIncome: number;
  monthlyDebtPayments: number;
  employmentStatus: string;
  employmentLengthMonths: number;
  requestedAmount: number;
  requestedTermMonths: number;
  loanPurpose: string;
  existingCustomer: boolean;
  accountAgeDays: number;
  collateralValue?: number;
  loanType: string;
}

export interface UnderwritingResult {
  approved: boolean;
  decisionScore: number;
  maxApprovedAmount: number;
  approvedRate: number;
  approvedTermMonths: number;
  monthlyPayment: number;
  dti: number;
  factors: ScoringFactor[];
  adverseActionReasons: AdverseActionReason[];
  explanation: string;
  riskGrade: string;
}

export interface ScoringFactor {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  detail: string;
}

export interface AdverseActionReason {
  code: string;
  description: string;
  category: string;
}

/**
 * ECOA/FCRA-compliant adverse action reason codes.
 * Based on CFPB Model Form B-1.
 */
const ADVERSE_ACTION_CODES: Record<string, { description: string; category: string }> = {
  AA001: { description: 'Credit score does not meet minimum requirements', category: 'credit_history' },
  AA002: { description: 'Insufficient credit history', category: 'credit_history' },
  AA003: { description: 'Debt-to-income ratio exceeds maximum threshold', category: 'income' },
  AA004: { description: 'Insufficient income for requested amount', category: 'income' },
  AA005: { description: 'Employment length does not meet minimum requirements', category: 'employment' },
  AA006: { description: 'Employment status not eligible', category: 'employment' },
  AA007: { description: 'Requested amount exceeds maximum for applicant profile', category: 'amount' },
  AA008: { description: 'Account age does not meet minimum requirements', category: 'relationship' },
  AA009: { description: 'Insufficient collateral value', category: 'collateral' },
  AA010: { description: 'Combined risk factors exceed acceptable threshold', category: 'overall' },
};

/**
 * Base rate table by risk grade.
 */
const BASE_RATES: Record<string, number> = {
  'A+': 0.0599,
  'A': 0.0749,
  'B': 0.0999,
  'C': 0.1299,
  'D': 0.1699,
  'E': 0.2199,
};

/**
 * Maximum DTI ratios by loan type.
 */
const MAX_DTI: Record<string, number> = {
  personal: 0.43,
  auto: 0.50,
  home_improvement: 0.45,
  debt_consolidation: 0.50,
  small_business: 0.55,
  credit_builder: 0.60,
};

/**
 * Minimum credit scores by loan type.
 */
const MIN_CREDIT_SCORES: Record<string, number> = {
  personal: 620,
  auto: 600,
  home_improvement: 640,
  debt_consolidation: 580,
  small_business: 650,
  credit_builder: 500,
};

/**
 * Score credit history factor (0-100).
 */
function scoreCreditHistory(creditScore: number, loanType: string): { score: number; detail: string } {
  const minScore = MIN_CREDIT_SCORES[loanType] || 620;

  if (creditScore >= 800) return { score: 100, detail: `Exceptional credit (${creditScore})` };
  if (creditScore >= 740) return { score: 90, detail: `Excellent credit (${creditScore})` };
  if (creditScore >= 700) return { score: 75, detail: `Good credit (${creditScore})` };
  if (creditScore >= 670) return { score: 60, detail: `Fair credit (${creditScore})` };
  if (creditScore >= minScore) return { score: 40, detail: `Below average credit (${creditScore})` };
  return { score: 0, detail: `Credit score ${creditScore} below minimum ${minScore}` };
}

/**
 * Score income/DTI factor (0-100).
 */
function scoreIncomeDti(
  annualIncome: number,
  monthlyDebtPayments: number,
  requestedAmount: number,
  termMonths: number,
  loanType: string,
): { score: number; dti: number; detail: string } {
  const monthlyIncome = annualIncome / 12;
  // Estimate monthly payment at 10% rate for DTI calculation
  const estimatedRate = 0.10 / 12;
  const estimatedPayment = requestedAmount * (estimatedRate * Math.pow(1 + estimatedRate, termMonths)) / (Math.pow(1 + estimatedRate, termMonths) - 1);
  const totalMonthlyDebt = monthlyDebtPayments + estimatedPayment;
  const dti = monthlyIncome > 0 ? totalMonthlyDebt / monthlyIncome : 1;
  const maxDti = MAX_DTI[loanType] || 0.43;

  if (dti <= maxDti * 0.5) return { score: 100, dti, detail: `Excellent DTI: ${(dti * 100).toFixed(1)}%` };
  if (dti <= maxDti * 0.7) return { score: 80, dti, detail: `Good DTI: ${(dti * 100).toFixed(1)}%` };
  if (dti <= maxDti * 0.85) return { score: 60, dti, detail: `Acceptable DTI: ${(dti * 100).toFixed(1)}%` };
  if (dti <= maxDti) return { score: 35, dti, detail: `High DTI: ${(dti * 100).toFixed(1)}%` };
  return { score: 0, dti, detail: `DTI ${(dti * 100).toFixed(1)}% exceeds max ${(maxDti * 100).toFixed(0)}%` };
}

/**
 * Score employment stability (0-100).
 */
function scoreEmployment(status: string, lengthMonths: number): { score: number; detail: string } {
  if (['unemployed', 'unknown'].includes(status)) {
    return { score: 0, detail: `Employment status: ${status}` };
  }

  if (status === 'retired') {
    return { score: 70, detail: 'Retired with income' };
  }

  if (lengthMonths >= 60) return { score: 100, detail: `${Math.floor(lengthMonths / 12)}+ years employment` };
  if (lengthMonths >= 24) return { score: 80, detail: `${Math.floor(lengthMonths / 12)} years employment` };
  if (lengthMonths >= 12) return { score: 55, detail: `${lengthMonths} months employment` };
  if (lengthMonths >= 6) return { score: 30, detail: `${lengthMonths} months employment (short tenure)` };
  return { score: 10, detail: `${lengthMonths} months employment (very short tenure)` };
}

/**
 * Score account relationship (0-100).
 */
function scoreRelationship(existingCustomer: boolean, accountAgeDays: number): { score: number; detail: string } {
  if (!existingCustomer) return { score: 30, detail: 'New customer' };
  if (accountAgeDays >= 730) return { score: 100, detail: `${Math.floor(accountAgeDays / 365)}+ year customer` };
  if (accountAgeDays >= 365) return { score: 80, detail: `${Math.floor(accountAgeDays / 365)} year customer` };
  if (accountAgeDays >= 180) return { score: 60, detail: `${Math.floor(accountAgeDays / 30)} month customer` };
  if (accountAgeDays >= 90) return { score: 45, detail: `${Math.floor(accountAgeDays / 30)} month customer` };
  return { score: 35, detail: `New customer (${accountAgeDays} days)` };
}

/**
 * Map decision score to risk grade.
 */
function getRiskGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'E';
}

/**
 * Calculate monthly payment using amortization formula.
 */
export function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

/**
 * Calculate maximum approved amount based on income and DTI limits.
 */
function calculateMaxAmount(
  annualIncome: number,
  monthlyDebtPayments: number,
  termMonths: number,
  rate: number,
  loanType: string,
): number {
  const monthlyIncome = annualIncome / 12;
  const maxDti = MAX_DTI[loanType] || 0.43;
  const maxTotalDebt = monthlyIncome * maxDti;
  const availableForLoan = maxTotalDebt - monthlyDebtPayments;

  if (availableForLoan <= 0) return 0;

  const monthlyRate = rate / 12;
  if (monthlyRate === 0) return availableForLoan * termMonths;

  // Reverse amortization to find max principal
  const maxPrincipal = availableForLoan * (Math.pow(1 + monthlyRate, termMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
  return Math.round(Math.max(0, maxPrincipal) * 100) / 100;
}

/**
 * Full credit underwriting assessment.
 * Returns approval decision, terms, and adverse action reasons if denied.
 */
export function underwrite(input: UnderwritingInput): UnderwritingResult {
  const factors: ScoringFactor[] = [];
  const adverseActionReasons: AdverseActionReason[] = [];

  // Factor 1: Credit History (30% weight)
  const creditResult = scoreCreditHistory(input.creditScore, input.loanType);
  factors.push({
    name: 'credit_history',
    score: creditResult.score,
    weight: 0.30,
    weightedScore: creditResult.score * 0.30,
    detail: creditResult.detail,
  });
  if (creditResult.score === 0) {
    adverseActionReasons.push({ code: 'AA001', ...ADVERSE_ACTION_CODES.AA001 });
  } else if (creditResult.score < 40) {
    adverseActionReasons.push({ code: 'AA002', ...ADVERSE_ACTION_CODES.AA002 });
  }

  // Factor 2: Income / DTI (30% weight)
  const incomeResult = scoreIncomeDti(
    input.annualIncome,
    input.monthlyDebtPayments,
    input.requestedAmount,
    input.requestedTermMonths,
    input.loanType,
  );
  factors.push({
    name: 'income_dti',
    score: incomeResult.score,
    weight: 0.30,
    weightedScore: incomeResult.score * 0.30,
    detail: incomeResult.detail,
  });
  if (incomeResult.score === 0) {
    adverseActionReasons.push({ code: 'AA003', ...ADVERSE_ACTION_CODES.AA003 });
  } else if (incomeResult.score < 40) {
    adverseActionReasons.push({ code: 'AA004', ...ADVERSE_ACTION_CODES.AA004 });
  }

  // Factor 3: Employment (20% weight)
  const employmentResult = scoreEmployment(input.employmentStatus, input.employmentLengthMonths);
  factors.push({
    name: 'employment',
    score: employmentResult.score,
    weight: 0.20,
    weightedScore: employmentResult.score * 0.20,
    detail: employmentResult.detail,
  });
  if (employmentResult.score === 0) {
    adverseActionReasons.push({ code: 'AA006', ...ADVERSE_ACTION_CODES.AA006 });
  } else if (employmentResult.score < 30) {
    adverseActionReasons.push({ code: 'AA005', ...ADVERSE_ACTION_CODES.AA005 });
  }

  // Factor 4: Customer Relationship (20% weight)
  const relationshipResult = scoreRelationship(input.existingCustomer, input.accountAgeDays);
  factors.push({
    name: 'customer_relationship',
    score: relationshipResult.score,
    weight: 0.20,
    weightedScore: relationshipResult.score * 0.20,
    detail: relationshipResult.detail,
  });
  if (!input.existingCustomer && relationshipResult.score < 35) {
    adverseActionReasons.push({ code: 'AA008', ...ADVERSE_ACTION_CODES.AA008 });
  }

  // Composite decision score
  const decisionScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);
  const riskGrade = getRiskGrade(decisionScore);

  // Determine approval
  const minApprovalScore = 35;
  const approved = decisionScore >= minApprovalScore && adverseActionReasons.filter(r => r.code === 'AA001' || r.code === 'AA003' || r.code === 'AA006').length === 0;

  // Determine rate
  const approvedRate = approved ? (BASE_RATES[riskGrade] || BASE_RATES.E) : 0;

  // Calculate max amount
  const maxApprovedAmount = approved
    ? Math.min(
        calculateMaxAmount(input.annualIncome, input.monthlyDebtPayments, input.requestedTermMonths, approvedRate, input.loanType),
        input.requestedAmount * 1.5, // Cap at 150% of requested
      )
    : 0;

  const finalAmount = approved ? Math.min(input.requestedAmount, maxApprovedAmount) : 0;
  const approvedTermMonths = approved ? input.requestedTermMonths : 0;
  const monthlyPayment = approved ? Math.round(calculateMonthlyPayment(finalAmount, approvedRate, approvedTermMonths) * 100) / 100 : 0;

  // Add overall adverse action if score too low
  if (!approved && adverseActionReasons.length === 0) {
    adverseActionReasons.push({ code: 'AA010', ...ADVERSE_ACTION_CODES.AA010 });
  }

  const explanation = approved
    ? `Approved: Risk grade ${riskGrade} (score ${decisionScore.toFixed(1)}). Rate: ${(approvedRate * 100).toFixed(2)}%. Amount: $${finalAmount.toFixed(2)} over ${approvedTermMonths} months. Monthly payment: $${monthlyPayment}.`
    : `Denied: Score ${decisionScore.toFixed(1)} (minimum ${minApprovalScore}). Reasons: ${adverseActionReasons.map(r => r.description).join('; ')}.`;

  return {
    approved,
    decisionScore: Math.round(decisionScore * 100) / 100,
    maxApprovedAmount: Math.round(maxApprovedAmount * 100) / 100,
    approvedRate,
    approvedTermMonths,
    monthlyPayment,
    dti: Math.round(incomeResult.dti * 10000) / 10000,
    factors,
    adverseActionReasons,
    explanation,
    riskGrade,
  };
}
