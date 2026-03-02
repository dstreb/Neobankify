import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';
import {
  constructPortfolio,
  calculateRebalanceActions,
  findTaxLossHarvestingOpportunities,
} from '../lib/portfolio-constructor';

export const portfolioRouter = Router();

// --- POST /portfolios ---
portfolioRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      name: z.string().min(1).max(100),
      initialInvestment: z.number().min(1),
      strategy: z.enum(['passive_index', 'balanced', 'growth', 'dividend_income']).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    // Fetch active suitability profile
    const profile = await db('investment_profiles')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .orderBy('assessed_at', 'desc')
      .first();

    if (!profile) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/precondition',
        title: 'Suitability Required',
        status: 400,
        detail: 'Please complete a suitability assessment before creating a portfolio.',
      });
      return;
    }

    const allocation = profile.recommended_allocation;
    const strategy = parsed.data.strategy || profile.recommended_strategy;
    const construction = constructPortfolio(allocation, parsed.data.initialInvestment);

    const portfolioId = uuidv4();
    await db('investment_portfolios').insert({
      id: portfolioId,
      tenant_id: tenantId,
      user_id: userId,
      profile_id: profile.id,
      name: parsed.data.name,
      strategy,
      status: 'pending_funding',
      target_allocation: allocation,
      current_allocation: allocation,
      total_value: parsed.data.initialInvestment,
      total_invested: parsed.data.initialInvestment,
      total_returns: 0,
      total_returns_pct: 0,
      rebalance_threshold: construction.rebalanceThreshold,
      auto_rebalance: true,
      tax_loss_harvesting: true,
      dividend_reinvestment: true,
      last_rebalanced_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create initial holdings
    for (const alloc of construction.allocations) {
      await db('portfolio_holdings').insert({
        id: uuidv4(),
        portfolio_id: portfolioId,
        tenant_id: tenantId,
        asset_class: alloc.assetClass,
        ticker: alloc.etfTicker,
        name: alloc.etfName,
        shares: 0, // Will be filled when orders execute
        cost_basis: 0,
        current_value: 0,
        target_weight: alloc.targetWeight,
        current_weight: alloc.currentWeight,
        unrealized_gain_loss: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    logger.info('Portfolio created', { userId, tenantId, portfolioId, strategy });

    res.status(201).json({
      success: true,
      data: {
        id: portfolioId,
        name: parsed.data.name,
        strategy,
        status: 'pending_funding',
        construction,
      },
    });
  } catch (error) {
    logger.error('Failed to create portfolio', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create portfolio.',
    });
  }
});

// --- GET /portfolios ---
portfolioRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const portfolios = await db('investment_portfolios')
      .where({ user_id: userId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: portfolios.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        strategy: p.strategy,
        status: p.status,
        totalValue: p.total_value,
        totalInvested: p.total_invested,
        totalReturns: p.total_returns,
        totalReturnsPct: p.total_returns_pct,
        autoRebalance: p.auto_rebalance,
        taxLossHarvesting: p.tax_loss_harvesting,
        lastRebalancedAt: p.last_rebalanced_at,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch portfolios', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch portfolios.',
    });
  }
});

// --- GET /portfolios/:id ---
portfolioRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const portfolio = await db('investment_portfolios')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .first();

    if (!portfolio) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Portfolio not found.',
      });
      return;
    }

    const holdings = await db('portfolio_holdings')
      .where({ portfolio_id: portfolio.id, tenant_id: tenantId })
      .orderBy('target_weight', 'desc');

    res.json({
      success: true,
      data: {
        id: portfolio.id,
        name: portfolio.name,
        strategy: portfolio.strategy,
        status: portfolio.status,
        totalValue: portfolio.total_value,
        totalInvested: portfolio.total_invested,
        totalReturns: portfolio.total_returns,
        totalReturnsPct: portfolio.total_returns_pct,
        targetAllocation: portfolio.target_allocation,
        currentAllocation: portfolio.current_allocation,
        rebalanceThreshold: portfolio.rebalance_threshold,
        autoRebalance: portfolio.auto_rebalance,
        taxLossHarvesting: portfolio.tax_loss_harvesting,
        dividendReinvestment: portfolio.dividend_reinvestment,
        lastRebalancedAt: portfolio.last_rebalanced_at,
        createdAt: portfolio.created_at,
        holdings: holdings.map((h: Record<string, unknown>) => ({
          id: h.id,
          assetClass: h.asset_class,
          ticker: h.ticker,
          name: h.name,
          shares: h.shares,
          costBasis: h.cost_basis,
          currentValue: h.current_value,
          targetWeight: h.target_weight,
          currentWeight: h.current_weight,
          unrealizedGainLoss: h.unrealized_gain_loss,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch portfolio', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch portfolio.',
    });
  }
});

// --- POST /portfolios/:id/rebalance ---
portfolioRouter.post('/:id/rebalance', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const portfolio = await db('investment_portfolios')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!portfolio) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Active portfolio not found.',
      });
      return;
    }

    const holdings = await db('portfolio_holdings')
      .where({ portfolio_id: portfolio.id, tenant_id: tenantId });

    const allocations = holdings.map((h: Record<string, unknown>) => ({
      assetClass: h.asset_class as string,
      targetWeight: h.target_weight as number,
      currentWeight: h.current_weight as number,
      etfTicker: h.ticker as string,
      etfName: h.name as string,
    }));

    // Mock prices for rebalance calculation (in production, fetch from market data)
    const prices: Record<string, number> = {};
    for (const h of holdings) {
      prices[h.ticker] = 100; // Placeholder
    }

    const actions = calculateRebalanceActions(allocations, portfolio.total_value, prices);

    if (actions.length === 0) {
      res.json({
        success: true,
        data: {
          message: 'Portfolio is within rebalance threshold. No action needed.',
          actions: [],
        },
      });
      return;
    }

    // Store rebalance event
    const rebalanceId = uuidv4();
    await db('portfolio_rebalances').insert({
      id: rebalanceId,
      portfolio_id: portfolio.id,
      tenant_id: tenantId,
      trigger: 'manual',
      status: 'pending',
      actions,
      before_allocation: portfolio.current_allocation,
      target_allocation: portfolio.target_allocation,
      created_at: new Date(),
    });

    logger.info('Rebalance initiated', {
      userId,
      tenantId,
      portfolioId: portfolio.id,
      rebalanceId,
      actionCount: actions.length,
    });

    res.json({
      success: true,
      data: {
        rebalanceId,
        status: 'pending',
        actions,
      },
    });
  } catch (error) {
    logger.error('Failed to rebalance portfolio', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to initiate rebalance.',
    });
  }
});

// --- GET /portfolios/:id/tax-loss-harvest ---
portfolioRouter.get('/:id/tax-loss-harvest', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const portfolio = await db('investment_portfolios')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .first();

    if (!portfolio) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Portfolio not found.',
      });
      return;
    }

    const holdings = await db('portfolio_holdings')
      .where({ portfolio_id: portfolio.id, tenant_id: tenantId });

    const holdingsForTlh = holdings.map((h: Record<string, unknown>) => ({
      assetClass: h.asset_class as string,
      ticker: h.ticker as string,
      costBasis: h.cost_basis as number,
      currentValue: h.current_value as number,
      holdingDays: Math.floor((Date.now() - new Date(h.created_at as string).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    const taxRate = 0.35; // Default combined federal+state rate
    const opportunities = findTaxLossHarvestingOpportunities(holdingsForTlh, taxRate);

    res.json({
      success: true,
      data: {
        opportunities,
        estimatedTotalSavings: opportunities.reduce((sum, o) => sum + o.estimatedTaxSavings, 0),
        washSaleWarnings: opportunities.filter(o => o.washSaleRisk).length,
      },
    });
  } catch (error) {
    logger.error('Failed to check tax-loss harvesting', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to check tax-loss harvesting opportunities.',
    });
  }
});

// --- PATCH /portfolios/:id/settings ---
portfolioRouter.patch('/:id/settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      autoRebalance: z.boolean().optional(),
      taxLossHarvesting: z.boolean().optional(),
      dividendReinvestment: z.boolean().optional(),
      rebalanceThreshold: z.number().min(0.01).max(0.20).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (parsed.data.autoRebalance !== undefined) updates.auto_rebalance = parsed.data.autoRebalance;
    if (parsed.data.taxLossHarvesting !== undefined) updates.tax_loss_harvesting = parsed.data.taxLossHarvesting;
    if (parsed.data.dividendReinvestment !== undefined) updates.dividend_reinvestment = parsed.data.dividendReinvestment;
    if (parsed.data.rebalanceThreshold !== undefined) updates.rebalance_threshold = parsed.data.rebalanceThreshold;

    const count = await db('investment_portfolios')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .update(updates);

    if (count === 0) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Portfolio not found.',
      });
      return;
    }

    res.json({ success: true, data: { message: 'Portfolio settings updated.' } });
  } catch (error) {
    logger.error('Failed to update portfolio settings', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to update portfolio settings.',
    });
  }
});
