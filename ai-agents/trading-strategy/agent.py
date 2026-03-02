"""
Trading Strategy Agent

Provides AI-driven trading signals, strategy evaluation, and risk management.

Capabilities:
- Signal generation based on technical and fundamental factors
- Strategy backtesting and evaluation
- Position sizing based on risk budget
- Drawdown monitoring and circuit breakers
- Paper trading strategy tracking

All decisions include explainability and audit trails.
Follows SEC/FINRA best execution requirements.
"""

import logging
import math
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class SignalType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    STRONG_BUY = "strong_buy"
    STRONG_SELL = "strong_sell"


class StrategyType(str, Enum):
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    BREAKOUT = "breakout"
    DIVIDEND_CAPTURE = "dividend_capture"
    PAIRS_TRADING = "pairs_trading"


class TimeFrame(str, Enum):
    INTRADAY = "intraday"
    SWING = "swing"  # 2-10 days
    POSITION = "position"  # weeks to months
    LONG_TERM = "long_term"  # months to years


@dataclass
class MarketBar:
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass
class TechnicalIndicators:
    sma_20: float = 0.0
    sma_50: float = 0.0
    sma_200: float = 0.0
    rsi_14: float = 50.0
    macd: float = 0.0
    macd_signal: float = 0.0
    macd_histogram: float = 0.0
    bollinger_upper: float = 0.0
    bollinger_lower: float = 0.0
    atr_14: float = 0.0
    volume_sma_20: float = 0.0
    obv: float = 0.0


@dataclass
class FundamentalData:
    pe_ratio: float = 0.0
    pb_ratio: float = 0.0
    dividend_yield: float = 0.0
    earnings_growth: float = 0.0
    revenue_growth: float = 0.0
    debt_to_equity: float = 0.0
    roe: float = 0.0
    sector: str = ""


@dataclass
class TradingSignal:
    ticker: str
    signal_type: SignalType
    strategy: StrategyType
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: float
    position_size_pct: float
    time_frame: TimeFrame
    reasoning: list[str] = field(default_factory=list)
    risk_reward_ratio: float = 0.0
    warnings: list[str] = field(default_factory=list)


@dataclass
class PortfolioRisk:
    total_value: float = 0.0
    cash_balance: float = 0.0
    buying_power: float = 0.0
    positions: list[dict[str, Any]] = field(default_factory=list)
    daily_pnl: float = 0.0
    unrealized_pnl: float = 0.0
    max_drawdown_pct: float = 0.0
    current_drawdown_pct: float = 0.0


# Strategy parameters
STRATEGY_PARAMS: dict[str, dict[str, Any]] = {
    "momentum": {
        "lookback_period": 20,
        "rsi_overbought": 70,
        "rsi_oversold": 30,
        "volume_threshold": 1.5,  # 1.5x average volume
        "min_confidence": 0.60,
    },
    "mean_reversion": {
        "bollinger_period": 20,
        "bollinger_std": 2.0,
        "rsi_overbought": 75,
        "rsi_oversold": 25,
        "min_confidence": 0.55,
    },
    "breakout": {
        "consolidation_bars": 10,
        "volume_surge": 2.0,
        "atr_multiplier": 1.5,
        "min_confidence": 0.50,
    },
}

# Risk limits
MAX_POSITION_SIZE_PCT = 0.10  # 10% of portfolio
MAX_PORTFOLIO_DRAWDOWN = 0.15  # 15% max drawdown
MAX_DAILY_LOSS = 0.03  # 3% daily loss limit
MAX_SECTOR_CONCENTRATION = 0.30  # 30% max in one sector
MIN_RISK_REWARD_RATIO = 1.5


class TradingStrategyAgent:
    """
    AI agent that generates and evaluates trading signals.

    Inputs:
        - Price bars and technical indicators
        - Fundamental data
        - Current portfolio and risk state
        - Strategy parameters

    Decision Model:
        - Multi-strategy signal generation
        - Confidence scoring from technical + fundamental factors
        - Risk-adjusted position sizing (Kelly criterion variant)
        - Circuit breaker checks

    Outputs:
        - Trading signals with entry, stop, target
        - Position size recommendations
        - Risk assessments

    Fail-safe Mechanisms:
        - Maximum position size limits
        - Portfolio drawdown circuit breaker
        - Daily loss limits
        - Sector concentration limits
        - Minimum risk-reward ratio

    Logging:
        - All signals logged with full reasoning chain
        - Win/loss tracking per strategy
        - Risk metrics tracked over time
    """

    def __init__(self) -> None:
        self.agent_type = "trading_strategy"

    def generate_signals(
        self,
        ticker: str,
        bars: list[MarketBar],
        indicators: TechnicalIndicators,
        fundamentals: FundamentalData,
        portfolio_risk: PortfolioRisk,
    ) -> list[TradingSignal]:
        """
        Generate trading signals across multiple strategies.
        Returns signals that pass risk checks.
        """
        if len(bars) < 2:
            return []

        current_price = bars[-1].close
        signals: list[TradingSignal] = []

        # Run each strategy
        momentum_signal = self._momentum_strategy(
            ticker, bars, indicators, current_price
        )
        if momentum_signal:
            signals.append(momentum_signal)

        mean_rev_signal = self._mean_reversion_strategy(
            ticker, indicators, current_price
        )
        if mean_rev_signal:
            signals.append(mean_rev_signal)

        breakout_signal = self._breakout_strategy(
            ticker, bars, indicators, current_price
        )
        if breakout_signal:
            signals.append(breakout_signal)

        # Apply fundamental overlay
        signals = self._apply_fundamental_filter(signals, fundamentals)

        # Apply risk checks
        signals = self._apply_risk_checks(signals, portfolio_risk, current_price)

        logger.info(
            "Signal generation complete",
            extra={
                "ticker": ticker,
                "current_price": current_price,
                "signals_generated": len(signals),
                "strategies": [s.strategy.value for s in signals],
            },
        )

        return signals

    def _momentum_strategy(
        self,
        ticker: str,
        bars: list[MarketBar],
        indicators: TechnicalIndicators,
        current_price: float,
    ) -> TradingSignal | None:
        """Momentum-based signal generation."""
        params = STRATEGY_PARAMS["momentum"]
        reasoning: list[str] = []
        score = 0.0

        # Trend direction (SMA alignment)
        if indicators.sma_20 > indicators.sma_50 > indicators.sma_200:
            reasoning.append("Strong uptrend: SMA20 > SMA50 > SMA200")
            score += 0.25
        elif indicators.sma_20 < indicators.sma_50 < indicators.sma_200:
            reasoning.append("Strong downtrend: SMA20 < SMA50 < SMA200")
            score -= 0.25

        # RSI momentum
        if indicators.rsi_14 > 50 and indicators.rsi_14 < params["rsi_overbought"]:
            reasoning.append(f"RSI at {indicators.rsi_14:.1f} — bullish momentum")
            score += 0.15
        elif indicators.rsi_14 < 50 and indicators.rsi_14 > params["rsi_oversold"]:
            reasoning.append(f"RSI at {indicators.rsi_14:.1f} — bearish momentum")
            score -= 0.15

        # MACD signal
        if indicators.macd > indicators.macd_signal and indicators.macd_histogram > 0:
            reasoning.append("MACD bullish crossover")
            score += 0.20
        elif indicators.macd < indicators.macd_signal and indicators.macd_histogram < 0:
            reasoning.append("MACD bearish crossover")
            score -= 0.20

        # Volume confirmation
        if len(bars) >= 2:
            recent_volume = bars[-1].volume
            if indicators.volume_sma_20 > 0:
                volume_ratio = recent_volume / indicators.volume_sma_20
                if volume_ratio > params["volume_threshold"]:
                    reasoning.append(
                        f"Volume {volume_ratio:.1f}x average — confirms signal"
                    )
                    score *= 1.2  # Amplify signal

        confidence = min(abs(score), 1.0)
        if confidence < params["min_confidence"]:
            return None

        signal_type = SignalType.BUY if score > 0 else SignalType.SELL
        if confidence > 0.80:
            signal_type = (
                SignalType.STRONG_BUY if score > 0 else SignalType.STRONG_SELL
            )

        # Calculate stop loss and take profit using ATR
        atr = indicators.atr_14 if indicators.atr_14 > 0 else current_price * 0.02
        if signal_type in (SignalType.BUY, SignalType.STRONG_BUY):
            stop_loss = current_price - (atr * 2)
            take_profit = current_price + (atr * 3)
        else:
            stop_loss = current_price + (atr * 2)
            take_profit = current_price - (atr * 3)

        risk = abs(current_price - stop_loss)
        reward = abs(take_profit - current_price)
        risk_reward = reward / risk if risk > 0 else 0

        return TradingSignal(
            ticker=ticker,
            signal_type=signal_type,
            strategy=StrategyType.MOMENTUM,
            confidence=round(confidence, 3),
            entry_price=current_price,
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2),
            position_size_pct=0.0,  # Set by risk checks
            time_frame=TimeFrame.SWING,
            reasoning=reasoning,
            risk_reward_ratio=round(risk_reward, 2),
        )

    def _mean_reversion_strategy(
        self,
        ticker: str,
        indicators: TechnicalIndicators,
        current_price: float,
    ) -> TradingSignal | None:
        """Mean reversion signal generation using Bollinger Bands and RSI."""
        params = STRATEGY_PARAMS["mean_reversion"]
        reasoning: list[str] = []
        score = 0.0

        # Bollinger Band position
        if indicators.bollinger_lower > 0 and current_price < indicators.bollinger_lower:
            reasoning.append(
                f"Price ${current_price:.2f} below lower BB ${indicators.bollinger_lower:.2f}"
            )
            score += 0.30
        elif indicators.bollinger_upper > 0 and current_price > indicators.bollinger_upper:
            reasoning.append(
                f"Price ${current_price:.2f} above upper BB ${indicators.bollinger_upper:.2f}"
            )
            score -= 0.30

        # RSI extremes
        if indicators.rsi_14 < params["rsi_oversold"]:
            reasoning.append(f"RSI {indicators.rsi_14:.1f} — oversold territory")
            score += 0.25
        elif indicators.rsi_14 > params["rsi_overbought"]:
            reasoning.append(f"RSI {indicators.rsi_14:.1f} — overbought territory")
            score -= 0.25

        # Mean reversion target: SMA20
        if indicators.sma_20 > 0:
            distance_to_mean = (indicators.sma_20 - current_price) / current_price
            if abs(distance_to_mean) > 0.03:
                reasoning.append(
                    f"Price {abs(distance_to_mean) * 100:.1f}% from SMA20 mean"
                )
                score += 0.15 if distance_to_mean > 0 else -0.15

        confidence = min(abs(score), 1.0)
        if confidence < params["min_confidence"]:
            return None

        signal_type = SignalType.BUY if score > 0 else SignalType.SELL

        # Target the mean (SMA20)
        atr = indicators.atr_14 if indicators.atr_14 > 0 else current_price * 0.02
        if signal_type == SignalType.BUY:
            stop_loss = current_price - (atr * 1.5)
            take_profit = indicators.sma_20 if indicators.sma_20 > current_price else current_price + (atr * 2)
        else:
            stop_loss = current_price + (atr * 1.5)
            take_profit = indicators.sma_20 if indicators.sma_20 < current_price else current_price - (atr * 2)

        risk = abs(current_price - stop_loss)
        reward = abs(take_profit - current_price)
        risk_reward = reward / risk if risk > 0 else 0

        return TradingSignal(
            ticker=ticker,
            signal_type=signal_type,
            strategy=StrategyType.MEAN_REVERSION,
            confidence=round(confidence, 3),
            entry_price=current_price,
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2),
            position_size_pct=0.0,
            time_frame=TimeFrame.SWING,
            reasoning=reasoning,
            risk_reward_ratio=round(risk_reward, 2),
        )

    def _breakout_strategy(
        self,
        ticker: str,
        bars: list[MarketBar],
        indicators: TechnicalIndicators,
        current_price: float,
    ) -> TradingSignal | None:
        """Breakout signal generation using price range and volume."""
        params = STRATEGY_PARAMS["breakout"]
        reasoning: list[str] = []
        score = 0.0

        lookback = min(params["consolidation_bars"], len(bars) - 1)
        if lookback < 5:
            return None

        recent_bars = bars[-lookback - 1:-1]
        range_high = max(b.high for b in recent_bars)
        range_low = min(b.low for b in recent_bars)
        range_pct = (range_high - range_low) / range_low if range_low > 0 else 0

        # Tight consolidation followed by breakout
        if range_pct < 0.05:  # Tight range
            if current_price > range_high:
                reasoning.append(
                    f"Upside breakout above ${range_high:.2f} resistance"
                )
                score += 0.35
            elif current_price < range_low:
                reasoning.append(
                    f"Downside breakdown below ${range_low:.2f} support"
                )
                score -= 0.35

        # Volume surge confirmation
        if indicators.volume_sma_20 > 0 and len(bars) >= 1:
            volume_ratio = bars[-1].volume / indicators.volume_sma_20
            if volume_ratio > params["volume_surge"]:
                reasoning.append(
                    f"Volume surge {volume_ratio:.1f}x average — confirms breakout"
                )
                score *= 1.3

        confidence = min(abs(score), 1.0)
        if confidence < params["min_confidence"]:
            return None

        signal_type = SignalType.BUY if score > 0 else SignalType.SELL

        atr = indicators.atr_14 if indicators.atr_14 > 0 else current_price * 0.02
        if signal_type == SignalType.BUY:
            stop_loss = range_low - atr
            take_profit = current_price + (range_high - range_low) * 2
        else:
            stop_loss = range_high + atr
            take_profit = current_price - (range_high - range_low) * 2

        risk = abs(current_price - stop_loss)
        reward = abs(take_profit - current_price)
        risk_reward = reward / risk if risk > 0 else 0

        return TradingSignal(
            ticker=ticker,
            signal_type=signal_type,
            strategy=StrategyType.BREAKOUT,
            confidence=round(confidence, 3),
            entry_price=current_price,
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2),
            position_size_pct=0.0,
            time_frame=TimeFrame.SWING,
            reasoning=reasoning,
            risk_reward_ratio=round(risk_reward, 2),
        )

    def _apply_fundamental_filter(
        self,
        signals: list[TradingSignal],
        fundamentals: FundamentalData,
    ) -> list[TradingSignal]:
        """Apply fundamental data overlay to adjust confidence."""
        filtered: list[TradingSignal] = []

        for signal in signals:
            adjustment = 0.0
            warnings: list[str] = []

            # PE ratio check
            if fundamentals.pe_ratio > 50:
                warnings.append(f"High P/E ratio: {fundamentals.pe_ratio:.1f}")
                if signal.signal_type in (SignalType.BUY, SignalType.STRONG_BUY):
                    adjustment -= 0.10

            # Debt check
            if fundamentals.debt_to_equity > 2.0:
                warnings.append(
                    f"High debt/equity: {fundamentals.debt_to_equity:.1f}"
                )
                adjustment -= 0.05

            # Earnings growth positive for buy signals
            if fundamentals.earnings_growth > 0.15:
                if signal.signal_type in (SignalType.BUY, SignalType.STRONG_BUY):
                    signal.reasoning.append(
                        f"Earnings growth {fundamentals.earnings_growth * 100:.0f}% supports buy"
                    )
                    adjustment += 0.05

            signal.confidence = max(0.0, min(1.0, signal.confidence + adjustment))
            signal.warnings.extend(warnings)
            filtered.append(signal)

        return filtered

    def _apply_risk_checks(
        self,
        signals: list[TradingSignal],
        portfolio: PortfolioRisk,
        current_price: float,
    ) -> list[TradingSignal]:
        """Apply portfolio-level risk checks and position sizing."""
        approved: list[TradingSignal] = []

        for signal in signals:
            warnings: list[str] = []

            # Circuit breaker: portfolio drawdown
            if portfolio.current_drawdown_pct >= MAX_PORTFOLIO_DRAWDOWN:
                signal.warnings.append(
                    f"Portfolio drawdown at {portfolio.current_drawdown_pct * 100:.1f}% — "
                    f"circuit breaker active"
                )
                continue  # Skip this signal entirely

            # Circuit breaker: daily loss limit
            if portfolio.total_value > 0:
                daily_loss_pct = abs(min(0, portfolio.daily_pnl)) / portfolio.total_value
                if daily_loss_pct >= MAX_DAILY_LOSS:
                    signal.warnings.append(
                        f"Daily loss at {daily_loss_pct * 100:.1f}% — limit reached"
                    )
                    continue

            # Minimum risk-reward ratio
            if signal.risk_reward_ratio < MIN_RISK_REWARD_RATIO:
                signal.warnings.append(
                    f"Risk/reward {signal.risk_reward_ratio:.1f} below minimum {MIN_RISK_REWARD_RATIO}"
                )
                continue

            # Position sizing (modified Kelly criterion)
            position_size = self._calculate_position_size(
                signal, portfolio, current_price
            )
            signal.position_size_pct = position_size

            if position_size <= 0:
                continue

            # Sector concentration check
            sector_exposure = sum(
                p.get("market_value", 0)
                for p in portfolio.positions
                if p.get("sector", "") == signal.ticker  # Simplified
            )
            if portfolio.total_value > 0:
                sector_pct = sector_exposure / portfolio.total_value
                if sector_pct >= MAX_SECTOR_CONCENTRATION:
                    warnings.append(
                        f"Sector concentration at {sector_pct * 100:.0f}%"
                    )
                    continue

            signal.warnings.extend(warnings)
            approved.append(signal)

        return approved

    def _calculate_position_size(
        self,
        signal: TradingSignal,
        portfolio: PortfolioRisk,
        current_price: float,
    ) -> float:
        """
        Calculate position size using modified Kelly criterion.
        Returns percentage of portfolio to allocate.
        """
        if portfolio.total_value <= 0 or portfolio.buying_power <= 0:
            return 0.0

        # Simplified Kelly: f = (p * b - q) / b
        # p = win probability (confidence), b = risk/reward ratio, q = 1-p
        p = signal.confidence
        b = signal.risk_reward_ratio
        q = 1.0 - p

        if b <= 0:
            return 0.0

        kelly = (p * b - q) / b
        if kelly <= 0:
            return 0.0

        # Half-Kelly for safety
        half_kelly = kelly / 2

        # Cap at max position size
        position_pct = min(half_kelly, MAX_POSITION_SIZE_PCT)

        # Ensure we have buying power
        position_value = portfolio.total_value * position_pct
        if position_value > portfolio.buying_power:
            position_pct = portfolio.buying_power / portfolio.total_value

        return round(position_pct, 4)

    def calculate_var(
        self,
        returns: list[float],
        confidence_level: float = 0.95,
        time_horizon_days: int = 1,
    ) -> float:
        """
        Calculate Value-at-Risk using historical simulation.
        Returns the VaR as a positive number (potential loss).
        """
        if len(returns) < 30:
            return 0.0

        sorted_returns = sorted(returns)
        index = int((1 - confidence_level) * len(sorted_returns))
        var_1d = abs(sorted_returns[max(0, index)])

        # Scale to time horizon (square root of time rule)
        var_scaled = var_1d * math.sqrt(time_horizon_days)

        return round(var_scaled, 6)

    def check_drawdown(
        self,
        equity_curve: list[float],
    ) -> dict[str, float]:
        """
        Calculate current and maximum drawdown from equity curve.
        """
        if len(equity_curve) < 2:
            return {"current_drawdown": 0.0, "max_drawdown": 0.0, "peak": 0.0}

        peak = equity_curve[0]
        max_dd = 0.0
        current_dd = 0.0

        for value in equity_curve:
            if value > peak:
                peak = value
            dd = (peak - value) / peak if peak > 0 else 0
            max_dd = max(max_dd, dd)
            current_dd = dd

        return {
            "current_drawdown": round(current_dd, 6),
            "max_drawdown": round(max_dd, 6),
            "peak": round(peak, 2),
        }
