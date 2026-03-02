import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

export const marketDataRouter = Router();

/**
 * Market data service.
 * In production, this would connect to Alpaca, Polygon.io, or similar providers.
 * Currently returns structured mock data for development.
 */

interface Quote {
  ticker: string;
  last: number;
  bid: number;
  ask: number;
  volume: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Simulated market data for development
const MOCK_QUOTES: Record<string, Omit<Quote, 'timestamp'>> = {
  AAPL: { ticker: 'AAPL', last: 178.52, bid: 178.50, ask: 178.54, volume: 52340000, change: 2.31, changePct: 0.0131, high: 179.80, low: 176.20, open: 176.80, previousClose: 176.21 },
  MSFT: { ticker: 'MSFT', last: 415.20, bid: 415.18, ask: 415.22, volume: 21500000, change: 3.15, changePct: 0.0076, high: 416.50, low: 412.00, open: 412.50, previousClose: 412.05 },
  GOOGL: { ticker: 'GOOGL', last: 141.80, bid: 141.78, ask: 141.82, volume: 18200000, change: -0.95, changePct: -0.0067, high: 143.20, low: 141.10, open: 142.75, previousClose: 142.75 },
  AMZN: { ticker: 'AMZN', last: 185.60, bid: 185.58, ask: 185.62, volume: 35600000, change: 1.80, changePct: 0.0098, high: 186.40, low: 183.80, open: 184.00, previousClose: 183.80 },
  TSLA: { ticker: 'TSLA', last: 245.30, bid: 245.25, ask: 245.35, volume: 98500000, change: -5.20, changePct: -0.0208, high: 252.00, low: 244.50, open: 250.50, previousClose: 250.50 },
  VTI: { ticker: 'VTI', last: 252.40, bid: 252.38, ask: 252.42, volume: 3200000, change: 1.20, changePct: 0.0048, high: 253.00, low: 251.00, open: 251.50, previousClose: 251.20 },
  BND: { ticker: 'BND', last: 72.80, bid: 72.79, ask: 72.81, volume: 5400000, change: 0.05, changePct: 0.0007, high: 72.90, low: 72.70, open: 72.75, previousClose: 72.75 },
  SPY: { ticker: 'SPY', last: 502.30, bid: 502.28, ask: 502.32, volume: 65000000, change: 2.50, changePct: 0.0050, high: 503.50, low: 499.80, open: 500.00, previousClose: 499.80 },
};

// --- GET /market-data/quote/:ticker ---
marketDataRouter.get('/quote/:ticker', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const quote = MOCK_QUOTES[ticker];

    if (!quote) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Symbol Not Found',
        status: 404,
        detail: `No market data available for ${ticker}.`,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...quote,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch quote', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch market data.',
    });
  }
});

// --- GET /market-data/quotes ---
marketDataRouter.get('/quotes', async (req: Request, res: Response): Promise<void> => {
  try {
    const tickers = (req.query.tickers as string || '').split(',').map(t => t.trim().toUpperCase()).filter(Boolean);

    if (tickers.length === 0) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Provide at least one ticker via ?tickers=AAPL,MSFT',
      });
      return;
    }

    if (tickers.length > 50) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Too Many Tickers',
        status: 400,
        detail: 'Maximum 50 tickers per request.',
      });
      return;
    }

    const quotes: Quote[] = [];
    const notFound: string[] = [];

    for (const ticker of tickers) {
      const quote = MOCK_QUOTES[ticker];
      if (quote) {
        quotes.push({ ...quote, timestamp: new Date().toISOString() });
      } else {
        notFound.push(ticker);
      }
    }

    res.json({
      success: true,
      data: {
        quotes,
        notFound: notFound.length > 0 ? notFound : undefined,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch quotes', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch market data.',
    });
  }
});

// --- GET /market-data/bars/:ticker ---
marketDataRouter.get('/bars/:ticker', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1D';
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 365);

    const quote = MOCK_QUOTES[ticker];
    if (!quote) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Symbol Not Found',
        status: 404,
        detail: `No market data available for ${ticker}.`,
      });
      return;
    }

    // Generate mock historical bars
    const bars: Bar[] = [];
    const basePrice = quote.last;
    const now = new Date();

    for (let i = limit - 1; i >= 0; i--) {
      const date = new Date(now);
      if (timeframe === '1D') {
        date.setDate(date.getDate() - i);
      } else if (timeframe === '1H') {
        date.setHours(date.getHours() - i);
      } else if (timeframe === '5M') {
        date.setMinutes(date.getMinutes() - i * 5);
      }

      // Random walk for mock data
      const noise = (Math.random() - 0.5) * basePrice * 0.03;
      const trend = (limit - i) * basePrice * 0.0002;
      const open = basePrice + noise - trend;
      const close = open + (Math.random() - 0.5) * basePrice * 0.02;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.01;
      const volume = Math.floor(quote.volume * (0.5 + Math.random()));

      bars.push({
        timestamp: date.toISOString(),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
      });
    }

    res.json({
      success: true,
      data: {
        ticker,
        timeframe,
        bars,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch bars', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch historical bars.',
    });
  }
});

// --- GET /market-data/movers ---
marketDataRouter.get('/movers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allQuotes = Object.values(MOCK_QUOTES).map(q => ({
      ...q,
      timestamp: new Date().toISOString(),
    }));

    const gainers = [...allQuotes].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
    const losers = [...allQuotes].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
    const mostActive = [...allQuotes].sort((a, b) => b.volume - a.volume).slice(0, 5);

    res.json({
      success: true,
      data: {
        gainers: gainers.map(q => ({ ticker: q.ticker, last: q.last, changePct: q.changePct, volume: q.volume })),
        losers: losers.map(q => ({ ticker: q.ticker, last: q.last, changePct: q.changePct, volume: q.volume })),
        mostActive: mostActive.map(q => ({ ticker: q.ticker, last: q.last, changePct: q.changePct, volume: q.volume })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch movers', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch market movers.',
    });
  }
});
