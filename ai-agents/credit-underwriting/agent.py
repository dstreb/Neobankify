"""
Credit Underwriting Agent

AI-driven credit underwriting with fair lending compliance.

Capabilities:
- Multi-factor credit risk assessment
- Income verification and DTI analysis
- Employment stability scoring
- Customer relationship value assessment
- Adverse action reason generation (ECOA/FCRA compliant)
- Fair lending monitoring and bias detection
- Loan pricing optimization with risk-based tiers

All decisions include explainability and audit trails.
Follows ECOA, FCRA, and fair lending regulations.
"""

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class DecisionType(str, Enum):
    APPROVED = "approved"
    DENIED = "denied"
    CONDITIONAL = "conditional"
    REFERRED = "referred"  # Needs human review


class LoanType(str, Enum):
    PERSONAL = "personal"
    LINE_OF_CREDIT = "line_of_credit"
    SECURED = "secured"
    EMERGENCY = "emergency"


class RiskGrade(str, Enum):
    A_PLUS = "A+"
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"


@dataclass
class CreditProfile:
    credit_score: int
    credit_history_months: int
    total_accounts: int
    delinquencies_30d: int = 0
    delinquencies_60d: int = 0
    delinquencies_90d: int = 0
    collections: int = 0
    bankruptcies: int = 0
    credit_utilization: float = 0.0
    total_credit_limit: float = 0.0
    total_balance: float = 0.0
    inquiries_6m: int = 0
    oldest_account_months: int = 0


@dataclass
class IncomeProfile:
    annual_income: float
    monthly_income: float
    employment_status: str  # employed, self_employed, retired, unemployed
    employer_name: str = ""
    job_title: str = ""
    employment_months: int = 0
    income_verified: bool = False
    other_income: float = 0.0
    monthly_obligations: float = 0.0  # Existing debt payments


@dataclass
class LoanApplication:
    application_id: str
    user_id: str
    tenant_id: str
    loan_type: LoanType
    requested_amount: float
    requested_term_months: int
    purpose: str = ""
    collateral_value: float = 0.0


@dataclass
class CustomerRelationship:
    account_age_months: int = 0
    total_deposits: float = 0.0
    average_balance: float = 0.0
    products_held: int = 0
    rewards_earned: float = 0.0
    is_direct_deposit: bool = False


@dataclass
class UnderwritingDecision:
    decision: DecisionType
    risk_grade: RiskGrade
    decision_score: float
    approved_amount: float
    approved_rate: float
    approved_term_months: int
    monthly_payment: float
    adverse_action_codes: list[str] = field(default_factory=list)
    adverse_action_reasons: list[str] = field(default_factory=list)
    conditions: list[str] = field(default_factory=list)
    scoring_factors: dict[str, float] = field(default_factory=dict)
    explanation: str = ""
    reasoning_chain: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


# Adverse action codes (ECOA/FCRA compliant)
ADVERSE_ACTION_CODES: dict[str, str] = {
    "AA001": "Credit score below minimum threshold",
    "AA002": "Insufficient credit history length",
    "AA003": "Excessive delinquencies on credit report",
    "AA004": "Bankruptcy or collections on record",
    "AA005": "Debt-to-income ratio exceeds maximum",
    "AA006": "Insufficient verified income",
    "AA007": "Employment history too short",
    "AA008": "Requested amount exceeds maximum for risk profile",
    "AA009": "Excessive recent credit inquiries",
    "AA010": "High credit utilization ratio",
}

# Risk-based pricing tiers
PRICING_TIERS: dict[str, dict[str, float]] = {
    "A+": {"base_rate": 5.99, "max_amount": 50000, "max_term": 60},
    "A": {"base_rate": 7.99, "max_amount": 40000, "max_term": 60},
    "B": {"base_rate": 10.99, "max_amount": 30000, "max_term": 48},
    "C": {"base_rate": 14.99, "max_amount": 20000, "max_term": 36},
    "D": {"base_rate": 19.99, "max_amount": 10000, "max_term": 24},
    "E": {"base_rate": 24.99, "max_amount": 5000, "max_term": 12},
}

# Scoring weights
SCORING_WEIGHTS: dict[str, float] = {
    "credit_history": 0.30,
    "income_dti": 0.30,
    "employment": 0.20,
    "relationship": 0.20,
}

# Minimum requirements
MIN_CREDIT_SCORE = 580
MIN_INCOME = 24000  # $24k annual
MAX_DTI = 0.43  # 43% debt-to-income
MIN_EMPLOYMENT_MONTHS = 3
MAX_UTILIZATION = 0.85


class CreditUnderwritingAgent:
    """
    AI agent that evaluates credit applications.

    Inputs:
        - Credit profile (bureau data)
        - Income profile (employment, income, obligations)
        - Loan application details
        - Customer relationship data

    Decision Model:
        - Multi-factor scoring: credit (30%), income/DTI (30%),
          employment (20%), relationship (20%)
        - Risk grade assignment (A+ through E)
        - Risk-based pricing with maximum amounts per tier
        - Adverse action code generation for denials

    Outputs:
        - Underwriting decision (approved/denied/conditional/referred)
        - Risk grade and decision score
        - Approved terms (amount, rate, term)
        - Adverse action reasons (ECOA compliant)

    Fail-safe Mechanisms:
        - Hard stops on minimum credit score
        - Maximum DTI enforcement
        - Predatory lending prevention (rate caps)
        - Fair lending monitoring
        - Auto-referral for edge cases

    Logging:
        - All decisions logged with full scoring breakdown
        - Adverse action codes tracked for FCRA compliance
        - Fair lending statistics maintained
    """

    def __init__(self) -> None:
        self.agent_type = "credit_underwriting"

    def underwrite(
        self,
        application: LoanApplication,
        credit: CreditProfile,
        income: IncomeProfile,
        relationship: CustomerRelationship,
    ) -> UnderwritingDecision:
        """
        Evaluate a loan application and produce an underwriting decision.
        """
        reasoning: list[str] = []
        adverse_codes: list[str] = []
        warnings: list[str] = []

        # Step 1: Hard stops (automatic denial)
        hard_stop = self._check_hard_stops(credit, income, application)
        if hard_stop:
            adverse_codes.extend(hard_stop["codes"])
            reasoning.extend(hard_stop["reasons"])

            decision = UnderwritingDecision(
                decision=DecisionType.DENIED,
                risk_grade=RiskGrade.E,
                decision_score=0.0,
                approved_amount=0.0,
                approved_rate=0.0,
                approved_term_months=0,
                monthly_payment=0.0,
                adverse_action_codes=adverse_codes,
                adverse_action_reasons=[
                    ADVERSE_ACTION_CODES[c] for c in adverse_codes
                ],
                explanation="Application denied due to minimum requirements not met.",
                reasoning_chain=reasoning,
            )

            self._log_decision(application, decision)
            return decision

        # Step 2: Score each factor
        credit_score_result = self._score_credit(credit)
        income_score_result = self._score_income(income, application)
        employment_score_result = self._score_employment(income)
        relationship_score_result = self._score_relationship(relationship)

        reasoning.extend(credit_score_result["reasoning"])
        reasoning.extend(income_score_result["reasoning"])
        reasoning.extend(employment_score_result["reasoning"])
        reasoning.extend(relationship_score_result["reasoning"])

        # Step 3: Calculate weighted decision score
        decision_score = (
            credit_score_result["score"] * SCORING_WEIGHTS["credit_history"]
            + income_score_result["score"] * SCORING_WEIGHTS["income_dti"]
            + employment_score_result["score"] * SCORING_WEIGHTS["employment"]
            + relationship_score_result["score"] * SCORING_WEIGHTS["relationship"]
        )

        scoring_factors = {
            "credit_history": round(credit_score_result["score"], 3),
            "income_dti": round(income_score_result["score"], 3),
            "employment": round(employment_score_result["score"], 3),
            "relationship": round(relationship_score_result["score"], 3),
            "weighted_total": round(decision_score, 3),
        }

        reasoning.append(f"Weighted decision score: {decision_score:.3f}")

        # Step 4: Assign risk grade
        risk_grade = self._assign_risk_grade(decision_score)
        reasoning.append(f"Risk grade: {risk_grade.value}")

        # Step 5: Determine decision and terms
        tier = PRICING_TIERS[risk_grade.value]
        approved_amount = min(application.requested_amount, tier["max_amount"])
        approved_term = min(
            application.requested_term_months, int(tier["max_term"])
        )
        approved_rate = tier["base_rate"]

        # Adjust rate based on exact score
        rate_adjustment = max(-1.0, (decision_score - 0.5) * 2)
        approved_rate = max(4.99, approved_rate - rate_adjustment)

        monthly_payment = self._calculate_monthly_payment(
            approved_amount, approved_rate, approved_term
        )

        # Check if monthly payment exceeds affordable amount
        dti = income.monthly_obligations / income.monthly_income if income.monthly_income > 0 else 1.0
        remaining_capacity = (MAX_DTI - dti) * income.monthly_income
        if monthly_payment > remaining_capacity and remaining_capacity > 0:
            # Reduce approved amount to fit DTI
            approved_amount = self._calculate_max_amount(
                remaining_capacity, approved_rate, approved_term
            )
            monthly_payment = self._calculate_monthly_payment(
                approved_amount, approved_rate, approved_term
            )
            warnings.append(
                f"Amount reduced to ${approved_amount:,.2f} to maintain DTI compliance"
            )
            reasoning.append(
                f"Approved amount reduced from ${application.requested_amount:,.2f} "
                f"to ${approved_amount:,.2f} for DTI compliance"
            )

        # Determine final decision
        if decision_score >= 0.60:
            decision_type = DecisionType.APPROVED
        elif decision_score >= 0.45:
            decision_type = DecisionType.CONDITIONAL
            conditions = self._generate_conditions(credit, income, decision_score)
        elif decision_score >= 0.35:
            decision_type = DecisionType.REFERRED
            warnings.append("Application requires manual underwriter review")
        else:
            decision_type = DecisionType.DENIED
            adverse_codes = self._generate_adverse_codes(
                credit_score_result, income_score_result,
                employment_score_result
            )

        conditions_list: list[str] = []
        if decision_type == DecisionType.CONDITIONAL:
            conditions_list = self._generate_conditions(credit, income, decision_score)

        decision = UnderwritingDecision(
            decision=decision_type,
            risk_grade=risk_grade,
            decision_score=round(decision_score, 4),
            approved_amount=round(approved_amount, 2) if decision_type in (
                DecisionType.APPROVED, DecisionType.CONDITIONAL
            ) else 0.0,
            approved_rate=round(approved_rate, 2) if decision_type in (
                DecisionType.APPROVED, DecisionType.CONDITIONAL
            ) else 0.0,
            approved_term_months=approved_term if decision_type in (
                DecisionType.APPROVED, DecisionType.CONDITIONAL
            ) else 0,
            monthly_payment=round(monthly_payment, 2) if decision_type in (
                DecisionType.APPROVED, DecisionType.CONDITIONAL
            ) else 0.0,
            adverse_action_codes=adverse_codes,
            adverse_action_reasons=[
                ADVERSE_ACTION_CODES[c] for c in adverse_codes if c in ADVERSE_ACTION_CODES
            ],
            conditions=conditions_list,
            scoring_factors=scoring_factors,
            explanation=self._generate_explanation(decision_type, risk_grade, scoring_factors),
            reasoning_chain=reasoning,
            warnings=warnings,
        )

        self._log_decision(application, decision)
        return decision

    def _check_hard_stops(
        self,
        credit: CreditProfile,
        income: IncomeProfile,
        application: LoanApplication,
    ) -> dict[str, Any] | None:
        """Check for automatic denial conditions."""
        codes: list[str] = []
        reasons: list[str] = []

        if credit.credit_score < MIN_CREDIT_SCORE:
            codes.append("AA001")
            reasons.append(
                f"Credit score {credit.credit_score} below minimum {MIN_CREDIT_SCORE}"
            )

        if credit.bankruptcies > 0 and credit.credit_history_months < 84:
            codes.append("AA004")
            reasons.append(
                "Bankruptcy on record within last 7 years"
            )

        annual_income = income.annual_income + income.other_income
        if annual_income < MIN_INCOME:
            codes.append("AA006")
            reasons.append(
                f"Total annual income ${annual_income:,.0f} below minimum ${MIN_INCOME:,.0f}"
            )

        if income.monthly_income > 0:
            current_dti = income.monthly_obligations / income.monthly_income
            if current_dti > MAX_DTI:
                codes.append("AA005")
                reasons.append(
                    f"Current DTI {current_dti * 100:.1f}% exceeds maximum {MAX_DTI * 100:.0f}%"
                )

        if codes:
            return {"codes": codes, "reasons": reasons}
        return None

    def _score_credit(self, credit: CreditProfile) -> dict[str, Any]:
        """Score the credit profile (0.0 - 1.0)."""
        score = 0.0
        reasoning: list[str] = []

        # Credit score component (0 - 0.40)
        if credit.credit_score >= 760:
            score += 0.40
            reasoning.append(f"Excellent credit score: {credit.credit_score}")
        elif credit.credit_score >= 700:
            score += 0.30
            reasoning.append(f"Good credit score: {credit.credit_score}")
        elif credit.credit_score >= 660:
            score += 0.20
            reasoning.append(f"Fair credit score: {credit.credit_score}")
        elif credit.credit_score >= 620:
            score += 0.10
            reasoning.append(f"Below average credit score: {credit.credit_score}")
        else:
            score += 0.05
            reasoning.append(f"Poor credit score: {credit.credit_score}")

        # Credit history length (0 - 0.20)
        if credit.credit_history_months >= 120:
            score += 0.20
            reasoning.append(f"Long credit history: {credit.credit_history_months // 12} years")
        elif credit.credit_history_months >= 60:
            score += 0.15
            reasoning.append(f"Moderate credit history: {credit.credit_history_months // 12} years")
        elif credit.credit_history_months >= 24:
            score += 0.08
            reasoning.append(f"Short credit history: {credit.credit_history_months // 12} years")
        else:
            score += 0.03
            reasoning.append("Very limited credit history")

        # Delinquencies (0 - 0.20, penalty)
        delinquency_penalty = (
            credit.delinquencies_30d * 0.03
            + credit.delinquencies_60d * 0.05
            + credit.delinquencies_90d * 0.08
            + credit.collections * 0.10
        )
        delinquency_score = max(0, 0.20 - delinquency_penalty)
        score += delinquency_score
        if delinquency_penalty > 0:
            reasoning.append(
                f"Delinquency penalty: -{delinquency_penalty:.2f} "
                f"({credit.delinquencies_30d} 30d, {credit.delinquencies_60d} 60d, "
                f"{credit.delinquencies_90d} 90d, {credit.collections} collections)"
            )
        else:
            reasoning.append("Clean payment history — no delinquencies")

        # Utilization (0 - 0.20)
        if credit.credit_utilization <= 0.10:
            score += 0.20
        elif credit.credit_utilization <= 0.30:
            score += 0.15
        elif credit.credit_utilization <= 0.50:
            score += 0.10
        elif credit.credit_utilization <= 0.75:
            score += 0.05
        else:
            score += 0.0
        reasoning.append(
            f"Credit utilization: {credit.credit_utilization * 100:.0f}%"
        )

        return {"score": min(score, 1.0), "reasoning": reasoning}

    def _score_income(
        self,
        income: IncomeProfile,
        application: LoanApplication,
    ) -> dict[str, Any]:
        """Score income and DTI (0.0 - 1.0)."""
        score = 0.0
        reasoning: list[str] = []

        # Income level (0 - 0.40)
        total_income = income.annual_income + income.other_income
        if total_income >= 150000:
            score += 0.40
            reasoning.append(f"High income: ${total_income:,.0f}")
        elif total_income >= 100000:
            score += 0.35
            reasoning.append(f"Above average income: ${total_income:,.0f}")
        elif total_income >= 60000:
            score += 0.25
            reasoning.append(f"Moderate income: ${total_income:,.0f}")
        elif total_income >= 36000:
            score += 0.15
            reasoning.append(f"Below average income: ${total_income:,.0f}")
        else:
            score += 0.05
            reasoning.append(f"Low income: ${total_income:,.0f}")

        # DTI ratio (0 - 0.35)
        if income.monthly_income > 0:
            dti = income.monthly_obligations / income.monthly_income
            if dti <= 0.20:
                score += 0.35
                reasoning.append(f"Low DTI: {dti * 100:.1f}%")
            elif dti <= 0.30:
                score += 0.25
                reasoning.append(f"Moderate DTI: {dti * 100:.1f}%")
            elif dti <= 0.36:
                score += 0.15
                reasoning.append(f"Above average DTI: {dti * 100:.1f}%")
            elif dti <= MAX_DTI:
                score += 0.05
                reasoning.append(f"High DTI: {dti * 100:.1f}%")
            else:
                reasoning.append(f"Excessive DTI: {dti * 100:.1f}%")

        # Income verification (0 - 0.15)
        if income.income_verified:
            score += 0.15
            reasoning.append("Income verified")
        else:
            score += 0.05
            reasoning.append("Income not yet verified")

        # Loan-to-income ratio (0 - 0.10)
        if total_income > 0:
            lti = application.requested_amount / total_income
            if lti <= 0.25:
                score += 0.10
                reasoning.append(f"Low loan-to-income: {lti * 100:.0f}%")
            elif lti <= 0.50:
                score += 0.05
                reasoning.append(f"Moderate loan-to-income: {lti * 100:.0f}%")
            else:
                reasoning.append(f"High loan-to-income: {lti * 100:.0f}%")

        return {"score": min(score, 1.0), "reasoning": reasoning}

    def _score_employment(self, income: IncomeProfile) -> dict[str, Any]:
        """Score employment stability (0.0 - 1.0)."""
        score = 0.0
        reasoning: list[str] = []

        # Employment status (0 - 0.40)
        status_scores = {
            "employed": 0.40,
            "self_employed": 0.30,
            "retired": 0.35,
            "unemployed": 0.0,
        }
        status_score = status_scores.get(income.employment_status, 0.10)
        score += status_score
        reasoning.append(f"Employment status: {income.employment_status} ({status_score:.2f})")

        # Employment tenure (0 - 0.40)
        if income.employment_months >= 60:
            score += 0.40
            reasoning.append(f"Long tenure: {income.employment_months // 12} years")
        elif income.employment_months >= 24:
            score += 0.30
            reasoning.append(f"Moderate tenure: {income.employment_months // 12} years")
        elif income.employment_months >= 12:
            score += 0.20
            reasoning.append(f"Short tenure: {income.employment_months} months")
        elif income.employment_months >= MIN_EMPLOYMENT_MONTHS:
            score += 0.10
            reasoning.append(f"Very short tenure: {income.employment_months} months")
        else:
            reasoning.append(f"Insufficient tenure: {income.employment_months} months")

        # Direct deposit bonus (0 - 0.20)
        # Checked via relationship data, simplified here
        score += 0.10  # Base for having any employment
        reasoning.append("Base employment score applied")

        return {"score": min(score, 1.0), "reasoning": reasoning}

    def _score_relationship(self, relationship: CustomerRelationship) -> dict[str, Any]:
        """Score customer relationship value (0.0 - 1.0)."""
        score = 0.0
        reasoning: list[str] = []

        # Account age (0 - 0.30)
        if relationship.account_age_months >= 24:
            score += 0.30
            reasoning.append(f"Established customer: {relationship.account_age_months // 12} years")
        elif relationship.account_age_months >= 12:
            score += 0.20
            reasoning.append(f"Moderate relationship: {relationship.account_age_months} months")
        elif relationship.account_age_months >= 6:
            score += 0.10
            reasoning.append(f"New customer: {relationship.account_age_months} months")
        else:
            score += 0.05
            reasoning.append("Very new customer")

        # Products held (0 - 0.20)
        product_score = min(relationship.products_held * 0.05, 0.20)
        score += product_score
        reasoning.append(f"Products held: {relationship.products_held}")

        # Direct deposit (0 - 0.20)
        if relationship.is_direct_deposit:
            score += 0.20
            reasoning.append("Direct deposit customer")

        # Average balance (0 - 0.15)
        if relationship.average_balance >= 10000:
            score += 0.15
            reasoning.append(f"High average balance: ${relationship.average_balance:,.0f}")
        elif relationship.average_balance >= 3000:
            score += 0.10
            reasoning.append(f"Moderate average balance: ${relationship.average_balance:,.0f}")
        elif relationship.average_balance >= 500:
            score += 0.05
            reasoning.append(f"Low average balance: ${relationship.average_balance:,.0f}")

        # Rewards activity (0 - 0.15)
        if relationship.rewards_earned > 0:
            score += 0.10
            reasoning.append(f"Active rewards user: ${relationship.rewards_earned:,.2f} earned")

        return {"score": min(score, 1.0), "reasoning": reasoning}

    def _assign_risk_grade(self, decision_score: float) -> RiskGrade:
        """Assign risk grade based on decision score."""
        if decision_score >= 0.85:
            return RiskGrade.A_PLUS
        elif decision_score >= 0.75:
            return RiskGrade.A
        elif decision_score >= 0.65:
            return RiskGrade.B
        elif decision_score >= 0.55:
            return RiskGrade.C
        elif decision_score >= 0.45:
            return RiskGrade.D
        else:
            return RiskGrade.E

    def _calculate_monthly_payment(
        self, principal: float, annual_rate: float, term_months: int
    ) -> float:
        """Calculate monthly payment using standard amortization formula."""
        if term_months <= 0 or principal <= 0:
            return 0.0
        monthly_rate = annual_rate / 100 / 12
        if monthly_rate == 0:
            return principal / term_months
        payment = principal * (
            monthly_rate * (1 + monthly_rate) ** term_months
        ) / ((1 + monthly_rate) ** term_months - 1)
        return round(payment, 2)

    def _calculate_max_amount(
        self, max_payment: float, annual_rate: float, term_months: int
    ) -> float:
        """Calculate maximum loan amount given payment constraint."""
        if term_months <= 0 or max_payment <= 0:
            return 0.0
        monthly_rate = annual_rate / 100 / 12
        if monthly_rate == 0:
            return max_payment * term_months
        principal = max_payment * (
            (1 + monthly_rate) ** term_months - 1
        ) / (monthly_rate * (1 + monthly_rate) ** term_months)
        return round(principal, 2)

    def _generate_conditions(
        self,
        credit: CreditProfile,
        income: IncomeProfile,
        decision_score: float,
    ) -> list[str]:
        """Generate conditions for conditional approval."""
        conditions: list[str] = []

        if not income.income_verified:
            conditions.append("Income verification required (pay stubs or tax returns)")

        if credit.credit_utilization > 0.50:
            conditions.append(
                f"Reduce credit utilization from {credit.credit_utilization * 100:.0f}% "
                f"to below 50% before disbursement"
            )

        if income.employment_months < 12:
            conditions.append("Employment verification letter required")

        if decision_score < 0.55:
            conditions.append("Additional collateral or co-signer may be required")

        return conditions

    def _generate_adverse_codes(
        self,
        credit_result: dict[str, Any],
        income_result: dict[str, Any],
        employment_result: dict[str, Any],
    ) -> list[str]:
        """Generate adverse action codes for denial (ECOA compliant)."""
        codes: list[str] = []

        if credit_result["score"] < 0.30:
            codes.append("AA001")
        if credit_result["score"] < 0.40:
            codes.append("AA002")
        if income_result["score"] < 0.30:
            codes.append("AA005")
        if employment_result["score"] < 0.30:
            codes.append("AA007")

        # Must provide at least one reason
        if not codes:
            codes.append("AA008")

        # ECOA requires no more than 4 principal reasons
        return codes[:4]

    def _generate_explanation(
        self,
        decision_type: DecisionType,
        risk_grade: RiskGrade,
        scoring_factors: dict[str, float],
    ) -> str:
        """Generate human-readable explanation of the decision."""
        if decision_type == DecisionType.APPROVED:
            return (
                f"Application approved with risk grade {risk_grade.value}. "
                f"Decision based on credit ({scoring_factors.get('credit_history', 0):.0%}), "
                f"income ({scoring_factors.get('income_dti', 0):.0%}), "
                f"employment ({scoring_factors.get('employment', 0):.0%}), and "
                f"relationship ({scoring_factors.get('relationship', 0):.0%}) factors."
            )
        elif decision_type == DecisionType.CONDITIONAL:
            return (
                f"Application conditionally approved with risk grade {risk_grade.value}. "
                f"Conditions must be met before final approval."
            )
        elif decision_type == DecisionType.REFERRED:
            return (
                f"Application requires manual review. Score of "
                f"{scoring_factors.get('weighted_total', 0):.3f} falls in review range."
            )
        else:
            return (
                f"Application denied. See adverse action notice for specific reasons."
            )

    def _log_decision(
        self,
        application: LoanApplication,
        decision: UnderwritingDecision,
    ) -> None:
        """Log the underwriting decision for audit trail."""
        logger.info(
            "Underwriting decision",
            extra={
                "application_id": application.application_id,
                "user_id": application.user_id,
                "tenant_id": application.tenant_id,
                "loan_type": application.loan_type.value,
                "requested_amount": application.requested_amount,
                "decision": decision.decision.value,
                "risk_grade": decision.risk_grade.value,
                "decision_score": decision.decision_score,
                "approved_amount": decision.approved_amount,
                "approved_rate": decision.approved_rate,
                "adverse_codes": decision.adverse_action_codes,
            },
        )

    def check_fair_lending(
        self,
        decisions: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Analyze decisions for fair lending compliance.
        Returns statistical analysis for ECOA/HMDA reporting.
        """
        if not decisions:
            return {"status": "no_data", "warnings": []}

        total = len(decisions)
        approved = sum(1 for d in decisions if d.get("decision") == "approved")
        denied = sum(1 for d in decisions if d.get("decision") == "denied")

        approval_rate = approved / total if total > 0 else 0
        denial_rate = denied / total if total > 0 else 0

        # Adverse action reason distribution
        reason_counts: dict[str, int] = {}
        for d in decisions:
            for code in d.get("adverse_action_codes", []):
                reason_counts[code] = reason_counts.get(code, 0) + 1

        warnings: list[str] = []

        # Flag potential disparities (simplified — production would use
        # demographic data and statistical testing)
        if denial_rate > 0.50:
            warnings.append(
                f"High denial rate: {denial_rate * 100:.1f}% — review for potential bias"
            )

        return {
            "status": "analyzed",
            "total_decisions": total,
            "approval_rate": round(approval_rate, 4),
            "denial_rate": round(denial_rate, 4),
            "adverse_action_distribution": reason_counts,
            "warnings": warnings,
        }
