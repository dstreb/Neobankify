-- Migration: 010_create_trading_tables
-- Description: Trading tables for Phase 2 - AI trading agents, market data, risk management
-- Supports: Watchlists, strategies, trade orders, positions, paper trading, risk limits

-- =====================================================
-- TRADING ACCOUNTS
-- =====================================================
CREATE TABLE trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('cash', 'margin')),
    provider VARCHAR(50) NOT NULL DEFAULT 'alpaca',
    provider_account_id VARCHAR(255),
    buying_power NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    portfolio_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    day_trade_count INTEGER NOT NULL DEFAULT 0,
    pattern_day_trader BOOLEAN NOT NULL DEFAULT false,
    margin_enabled BOOLEAN NOT NULL DEFAULT false,
    margin_used NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_paper BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed', 'pending_approval')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_tenant ON trading_accounts(tenant_id);
CREATE INDEX idx_trading_accounts_provider ON trading_accounts(provider, provider_account_id);

-- =====================================================
-- WATCHLISTS
-- =====================================================
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL DEFAULT 'My Watchlist',
    symbols JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON watchlists(user_id);
CREATE INDEX idx_watchlists_tenant ON watchlists(tenant_id);

-- =====================================================
-- TRADING STRATEGIES
-- =====================================================
CREATE TABLE trading_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    strategy_type VARCHAR(30) NOT NULL CHECK (strategy_type IN ('momentum', 'mean_reversion', 'trend_following', 'pairs_trading', 'statistical_arbitrage', 'custom')),
    parameters JSONB NOT NULL DEFAULT '{}',
    risk_limits JSONB NOT NULL DEFAULT '{}',
    symbols JSONB NOT NULL DEFAULT '[]',
    timeframe VARCHAR(10) NOT NULL DEFAULT '1d' CHECK (timeframe IN ('1m', '5m', '15m', '1h', '4h', '1d', '1w')),
    max_position_size NUMERIC(15,2) NOT NULL DEFAULT 10000.00,
    max_portfolio_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    stop_loss_pct NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    take_profit_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    max_daily_trades INTEGER NOT NULL DEFAULT 10,
    backtest_sharpe NUMERIC(8,4),
    backtest_max_drawdown NUMERIC(8,4),
    backtest_win_rate NUMERIC(5,2),
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_paper_only BOOLEAN NOT NULL DEFAULT true,
    approved_for_live BOOLEAN NOT NULL DEFAULT false,
    approved_by VARCHAR(50),
    approved_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'backtesting', 'paper_trading', 'live', 'paused', 'retired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategies_tenant ON trading_strategies(tenant_id);
CREATE INDEX idx_strategies_user ON trading_strategies(user_id);
CREATE INDEX idx_strategies_status ON trading_strategies(status);

-- =====================================================
-- TRADE ORDERS
-- =====================================================
CREATE TABLE trade_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id),
    strategy_id UUID REFERENCES trading_strategies(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell', 'sell_short', 'buy_to_cover')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
    time_in_force VARCHAR(10) NOT NULL DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok')),
    quantity NUMERIC(18,8) NOT NULL,
    limit_price NUMERIC(15,4),
    stop_price NUMERIC(15,4),
    trail_pct NUMERIC(5,2),
    filled_quantity NUMERIC(18,8) DEFAULT 0,
    filled_avg_price NUMERIC(15,4) DEFAULT 0,
    commission NUMERIC(10,4) DEFAULT 0,
    provider_order_id VARCHAR(255),
    is_paper BOOLEAN NOT NULL DEFAULT false,
    signal_data JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'partial_fill', 'filled', 'cancelled', 'rejected', 'expired')),
    submitted_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_orders_user ON trade_orders(user_id);
CREATE INDEX idx_trade_orders_tenant ON trade_orders(tenant_id);
CREATE INDEX idx_trade_orders_account ON trade_orders(trading_account_id);
CREATE INDEX idx_trade_orders_strategy ON trade_orders(strategy_id);
CREATE INDEX idx_trade_orders_status ON trade_orders(status);
CREATE INDEX idx_trade_orders_symbol ON trade_orders(symbol);

-- =====================================================
-- POSITIONS
-- =====================================================
CREATE TABLE trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    quantity NUMERIC(18,8) NOT NULL DEFAULT 0,
    avg_entry_price NUMERIC(15,4) NOT NULL DEFAULT 0,
    current_price NUMERIC(15,4) NOT NULL DEFAULT 0,
    market_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    unrealized_pnl NUMERIC(15,2) NOT NULL DEFAULT 0,
    unrealized_pnl_pct NUMERIC(8,4) NOT NULL DEFAULT 0,
    realized_pnl NUMERIC(15,2) NOT NULL DEFAULT 0,
    cost_basis NUMERIC(15,2) NOT NULL DEFAULT 0,
    strategy_id UUID REFERENCES trading_strategies(id),
    is_paper BOOLEAN NOT NULL DEFAULT false,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_price_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trading_account_id, symbol, side, is_paper)
);

CREATE INDEX idx_positions_account ON trading_positions(trading_account_id);
CREATE INDEX idx_positions_tenant ON trading_positions(tenant_id);
CREATE INDEX idx_positions_user ON trading_positions(user_id);
CREATE INDEX idx_positions_symbol ON trading_positions(symbol);

-- =====================================================
-- RISK METRICS (per-account risk snapshot)
-- =====================================================
CREATE TABLE risk_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    value_at_risk_1d NUMERIC(15,2) NOT NULL DEFAULT 0,
    value_at_risk_5d NUMERIC(15,2) NOT NULL DEFAULT 0,
    max_drawdown NUMERIC(8,4) NOT NULL DEFAULT 0,
    current_drawdown NUMERIC(8,4) NOT NULL DEFAULT 0,
    sharpe_ratio NUMERIC(8,4) NOT NULL DEFAULT 0,
    sortino_ratio NUMERIC(8,4) NOT NULL DEFAULT 0,
    beta NUMERIC(8,4) NOT NULL DEFAULT 0,
    volatility_30d NUMERIC(8,4) NOT NULL DEFAULT 0,
    concentration_top_holding NUMERIC(5,2) NOT NULL DEFAULT 0,
    margin_utilization NUMERIC(5,2) NOT NULL DEFAULT 0,
    daily_pnl NUMERIC(15,2) NOT NULL DEFAULT 0,
    weekly_pnl NUMERIC(15,2) NOT NULL DEFAULT 0,
    monthly_pnl NUMERIC(15,2) NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'moderate' CHECK (risk_level IN ('low', 'moderate', 'elevated', 'high', 'critical')),
    alerts JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_metrics_account ON risk_metrics(trading_account_id);
CREATE INDEX idx_risk_metrics_tenant ON risk_metrics(tenant_id);
CREATE INDEX idx_risk_metrics_time ON risk_metrics(calculated_at);

-- =====================================================
-- BACKTEST RESULTS
-- =====================================================
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES trading_strategies(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital NUMERIC(15,2) NOT NULL,
    final_value NUMERIC(15,2) NOT NULL,
    total_return_pct NUMERIC(8,4) NOT NULL,
    annualized_return_pct NUMERIC(8,4) NOT NULL,
    sharpe_ratio NUMERIC(8,4) NOT NULL,
    sortino_ratio NUMERIC(8,4),
    max_drawdown_pct NUMERIC(8,4) NOT NULL,
    win_rate NUMERIC(5,2) NOT NULL,
    profit_factor NUMERIC(8,4),
    total_trades INTEGER NOT NULL,
    avg_trade_duration_hours NUMERIC(10,2),
    benchmark_return_pct NUMERIC(8,4),
    alpha NUMERIC(8,4),
    beta NUMERIC(8,4),
    trade_log JSONB DEFAULT '[]',
    equity_curve JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_backtest_strategy ON backtest_results(strategy_id);
CREATE INDEX idx_backtest_tenant ON backtest_results(tenant_id);

-- =====================================================
-- Compatibility renames / extensions to match service code
-- =====================================================

-- Add fields used by trading-service routes
ALTER TABLE trading_accounts
    ADD COLUMN risk_level VARCHAR(20) CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),
    ADD COLUMN peak_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN total_pnl NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN day_pnl NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN external_account_id VARCHAR(255);

ALTER TABLE trading_accounts DROP CONSTRAINT trading_accounts_account_type_check;
ALTER TABLE trading_accounts ADD CONSTRAINT trading_accounts_account_type_check CHECK (account_type IN ('cash', 'individual', 'margin'));

-- Service code references trading_orders and uses account_id / ticker naming
ALTER TABLE trade_orders RENAME TO trading_orders;
ALTER TABLE trading_orders RENAME COLUMN trading_account_id TO account_id;
ALTER TABLE trading_orders RENAME COLUMN symbol TO ticker;
ALTER TABLE trading_orders RENAME COLUMN trail_pct TO trailing_pct;
ALTER TABLE trading_orders RENAME COLUMN is_paper TO is_paper_trade;
ALTER TABLE trading_orders RENAME COLUMN provider_order_id TO external_order_id;

ALTER TABLE trading_orders DROP CONSTRAINT trade_orders_side_check;
ALTER TABLE trading_orders ADD CONSTRAINT trading_orders_side_check CHECK (side IN ('buy', 'sell', 'short', 'cover'));

-- Service code uses trading_positions.account_id and ticker naming
ALTER TABLE trading_positions RENAME COLUMN trading_account_id TO account_id;
ALTER TABLE trading_positions RENAME COLUMN symbol TO ticker;
ALTER TABLE trading_positions RENAME COLUMN market_value TO current_value;
ALTER TABLE trading_positions
    ADD COLUMN day_pnl NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN day_pnl_pct NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    ADD COLUMN closed_at TIMESTAMPTZ;

-- Paper trading accounts table (used by paper-trading routes)
CREATE TABLE paper_trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    initial_balance NUMERIC(15,2) NOT NULL,
    cash_balance NUMERIC(15,2) NOT NULL,
    portfolio_value NUMERIC(15,2) NOT NULL,
    peak_value NUMERIC(15,2) NOT NULL,
    total_pnl NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paper_trading_accounts_user ON paper_trading_accounts(user_id);
CREATE INDEX idx_paper_trading_accounts_tenant ON paper_trading_accounts(tenant_id);
CREATE INDEX idx_paper_trading_accounts_status ON paper_trading_accounts(status);
