-- Migration: 011_create_lending_tables
-- Description: Lending tables for Phase 2 - loan origination, underwriting, fair lending
-- Supports: Credit scoring, loan applications, payment schedules, adverse actions, fair lending

-- =====================================================
-- CREDIT PROFILES
-- =====================================================
CREATE TABLE credit_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    credit_score INTEGER,
    credit_score_source VARCHAR(30) CHECK (credit_score_source IN ('experian', 'equifax', 'transunion', 'internal_model', 'vantage')),
    credit_score_date DATE,
    debt_to_income NUMERIC(5,2),
    total_debt NUMERIC(15,2),
    total_monthly_payments NUMERIC(15,2),
    monthly_income NUMERIC(15,2),
    employment_status VARCHAR(30) CHECK (employment_status IN ('employed', 'self_employed', 'unemployed', 'retired', 'student')),
    employer_name VARCHAR(255),
    years_employed NUMERIC(4,1),
    housing_status VARCHAR(30) CHECK (housing_status IN ('own', 'rent', 'mortgage', 'other')),
    housing_payment NUMERIC(10,2),
    bankruptcy_history BOOLEAN NOT NULL DEFAULT false,
    delinquency_history BOOLEAN NOT NULL DEFAULT false,
    open_accounts INTEGER,
    credit_utilization NUMERIC(5,2),
    oldest_account_age_months INTEGER,
    internal_risk_score NUMERIC(5,2),
    risk_tier VARCHAR(10) CHECK (risk_tier IN ('prime_plus', 'prime', 'near_prime', 'subprime', 'deep_subprime')),
    last_updated TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stale', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_profiles_user ON credit_profiles(user_id);
CREATE INDEX idx_credit_profiles_tenant ON credit_profiles(tenant_id);
CREATE UNIQUE INDEX idx_credit_profiles_active ON credit_profiles(user_id, tenant_id) WHERE status = 'active';

-- =====================================================
-- LOAN PRODUCTS (configurable per tenant)
-- =====================================================
CREATE TABLE loan_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(30) NOT NULL CHECK (product_type IN ('personal', 'auto', 'home_improvement', 'debt_consolidation', 'small_business', 'line_of_credit')),
    min_amount NUMERIC(15,2) NOT NULL,
    max_amount NUMERIC(15,2) NOT NULL,
    min_term_months INTEGER NOT NULL,
    max_term_months INTEGER NOT NULL,
    base_apr NUMERIC(6,3) NOT NULL,
    max_apr NUMERIC(6,3) NOT NULL,
    origination_fee_pct NUMERIC(5,3) NOT NULL DEFAULT 0,
    late_fee NUMERIC(10,2) NOT NULL DEFAULT 25.00,
    min_credit_score INTEGER,
    max_dti NUMERIC(5,2),
    required_income NUMERIC(15,2),
    collateral_required BOOLEAN NOT NULL DEFAULT false,
    risk_tier_eligibility JSONB DEFAULT '["prime_plus", "prime", "near_prime"]',
    underwriting_rules JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_products_tenant ON loan_products(tenant_id);
CREATE INDEX idx_loan_products_type ON loan_products(product_type);

-- =====================================================
-- LOAN APPLICATIONS
-- =====================================================
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    loan_product_id UUID NOT NULL REFERENCES loan_products(id),
    requested_amount NUMERIC(15,2) NOT NULL,
    requested_term_months INTEGER NOT NULL,
    purpose TEXT,
    annual_income NUMERIC(15,2) NOT NULL,
    employment_status VARCHAR(30) NOT NULL,
    employer_name VARCHAR(255),
    years_employed NUMERIC(4,1),
    housing_status VARCHAR(30) NOT NULL,
    housing_payment NUMERIC(10,2),
    co_borrower_id UUID REFERENCES users(id),
    credit_score_at_application INTEGER,
    dti_at_application NUMERIC(5,2),
    risk_tier_at_application VARCHAR(10),
    approved_amount NUMERIC(15,2),
    approved_apr NUMERIC(6,3),
    approved_term_months INTEGER,
    origination_fee NUMERIC(10,2),
    monthly_payment NUMERIC(10,2),
    underwriting_decision JSONB DEFAULT '{}',
    ai_risk_assessment JSONB DEFAULT '{}',
    fair_lending_check JSONB DEFAULT '{}',
    adverse_action_reasons JSONB DEFAULT '[]',
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'conditionally_approved', 'denied', 'withdrawn', 'expired', 'funded')),
    submitted_at TIMESTAMPTZ,
    decision_at TIMESTAMPTZ,
    funded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_apps_user ON loan_applications(user_id);
CREATE INDEX idx_loan_apps_tenant ON loan_applications(tenant_id);
CREATE INDEX idx_loan_apps_product ON loan_applications(loan_product_id);
CREATE INDEX idx_loan_apps_status ON loan_applications(status);

-- =====================================================
-- LOANS (active/funded loans)
-- =====================================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES loan_applications(id),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    loan_product_id UUID NOT NULL REFERENCES loan_products(id),
    loan_number VARCHAR(50) NOT NULL,
    principal_amount NUMERIC(15,2) NOT NULL,
    current_balance NUMERIC(15,2) NOT NULL,
    apr NUMERIC(6,3) NOT NULL,
    term_months INTEGER NOT NULL,
    monthly_payment NUMERIC(10,2) NOT NULL,
    origination_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_interest_paid NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_principal_paid NUMERIC(15,2) NOT NULL DEFAULT 0,
    next_payment_date DATE,
    next_payment_amount NUMERIC(10,2),
    payments_made INTEGER NOT NULL DEFAULT 0,
    payments_remaining INTEGER NOT NULL,
    days_past_due INTEGER NOT NULL DEFAULT 0,
    disbursement_method VARCHAR(20) CHECK (disbursement_method IN ('ach', 'wire', 'check')),
    auto_pay_enabled BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'current', 'delinquent', 'default', 'paid_off', 'charged_off', 'forbearance')),
    funded_at TIMESTAMPTZ NOT NULL,
    maturity_date DATE NOT NULL,
    paid_off_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_tenant ON loans(tenant_id);
CREATE INDEX idx_loans_application ON loans(application_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE UNIQUE INDEX idx_loans_number ON loans(tenant_id, loan_number);

-- =====================================================
-- PAYMENT SCHEDULE
-- =====================================================
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    payment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal_amount NUMERIC(10,2) NOT NULL,
    interest_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    paid_date DATE,
    late_fee NUMERIC(10,2) DEFAULT 0,
    days_late INTEGER DEFAULT 0,
    remaining_balance NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('ach', 'debit_card', 'check', 'auto_pay')),
    provider_transaction_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'paid', 'partial', 'late', 'missed', 'waived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_payments_tenant ON loan_payments(tenant_id);
CREATE INDEX idx_payments_due ON loan_payments(due_date);
CREATE INDEX idx_payments_status ON loan_payments(status);

-- =====================================================
-- ADVERSE ACTION NOTICES (ECOA/FCRA compliance)
-- =====================================================
CREATE TABLE adverse_action_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_application_id UUID NOT NULL REFERENCES loan_applications(id),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    notice_type VARCHAR(30) NOT NULL CHECK (notice_type IN ('denial', 'counteroffer', 'adverse_terms')),
    primary_reasons JSONB NOT NULL DEFAULT '[]',
    credit_score_used INTEGER,
    credit_bureau VARCHAR(30),
    credit_score_range VARCHAR(20),
    model_factors JSONB DEFAULT '[]',
    applicant_rights TEXT NOT NULL,
    creditor_info JSONB NOT NULL DEFAULT '{}',
    sent_via VARCHAR(20) NOT NULL CHECK (sent_via IN ('email', 'mail', 'in_app', 'all')),
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adverse_action_app ON adverse_action_notices(loan_application_id);
CREATE INDEX idx_adverse_action_user ON adverse_action_notices(user_id);
CREATE INDEX idx_adverse_action_tenant ON adverse_action_notices(tenant_id);

-- =====================================================
-- FAIR LENDING AUDIT LOG
-- =====================================================
CREATE TABLE fair_lending_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_application_id UUID NOT NULL REFERENCES loan_applications(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    analysis_type VARCHAR(30) NOT NULL CHECK (analysis_type IN ('disparate_impact', 'disparate_treatment', 'regression_analysis', 'marginal_effect')),
    protected_class VARCHAR(30) NOT NULL CHECK (protected_class IN ('race', 'ethnicity', 'sex', 'age', 'marital_status', 'national_origin', 'religion')),
    model_version VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL DEFAULT '{}',
    prediction_score NUMERIC(5,4),
    counterfactual_score NUMERIC(5,4),
    disparity_ratio NUMERIC(8,4),
    passes_threshold BOOLEAN NOT NULL,
    threshold_value NUMERIC(5,4) NOT NULL DEFAULT 0.80,
    explanation JSONB DEFAULT '{}',
    reviewer VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fair_lending_app ON fair_lending_audit(loan_application_id);
CREATE INDEX idx_fair_lending_tenant ON fair_lending_audit(tenant_id);
CREATE INDEX idx_fair_lending_type ON fair_lending_audit(analysis_type);
CREATE INDEX idx_fair_lending_fails ON fair_lending_audit(passes_threshold) WHERE passes_threshold = false;

-- =====================================================
-- Compatibility extensions to match service code
-- =====================================================

-- loan_applications: add collateral_value used by loan application form
ALTER TABLE loan_applications ADD COLUMN collateral_value NUMERIC(15,2);

-- loan_applications: add loan_type for adverse action notice (populated from loan_products.product_type)
ALTER TABLE loan_applications ADD COLUMN loan_type VARCHAR(30);

-- loans: status check needs 'current' which is already in the constraint, OK

-- loan_applications status: add 'originated' and 'funded' 
ALTER TABLE loan_applications DROP CONSTRAINT loan_applications_status_check;
ALTER TABLE loan_applications ADD CONSTRAINT loan_applications_status_check
  CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'conditionally_approved', 'denied', 'withdrawn', 'expired', 'funded', 'originated'));
