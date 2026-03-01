import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../config/database';
import { logger } from '../config/logger';

export const cardsRouter = Router();

// --- GET /cards ---
cardsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const cards = await db('user_cards')
      .where({ user_id: userId, status: 'active' })
      .orderBy('is_primary', 'desc');

    res.json({
      success: true,
      data: cards.map(c => ({
        id: c.id,
        cardName: c.card_name,
        issuer: c.issuer,
        network: c.network,
        lastFour: c.last_four,
        rewardProgramId: c.reward_program_id,
        isPrimary: c.is_primary,
        addedAt: c.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch cards', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch cards.',
    });
  }
});

// --- POST /cards ---
const addCardSchema = z.object({
  cardName: z.string().min(1),
  issuer: z.string().min(1),
  network: z.enum(['visa', 'mastercard', 'amex', 'discover']),
  lastFour: z.string().length(4),
  rewardProgramId: z.string().uuid().optional(),
  isPrimary: z.boolean().optional().default(false),
});

cardsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = addCardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { cardName, issuer, network, lastFour, rewardProgramId, isPrimary } = parsed.data;

    // If setting as primary, unset existing primary
    if (isPrimary) {
      await db('user_cards')
        .where({ user_id: userId, is_primary: true })
        .update({ is_primary: false });
    }

    const cardId = uuidv4();
    await db('user_cards').insert({
      id: cardId,
      user_id: userId,
      card_name: cardName,
      issuer,
      network,
      last_four: lastFour,
      reward_program_id: rewardProgramId || null,
      is_primary: isPrimary,
      status: 'active',
      created_at: new Date(),
    });

    logger.info('Card added', { userId, cardId, issuer });

    res.status(201).json({
      success: true,
      data: { id: cardId, cardName, issuer, network, lastFour },
    });
  } catch (error) {
    logger.error('Failed to add card', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to add card.',
    });
  }
});

// --- DELETE /cards/:id ---
cardsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const updated = await db('user_cards')
      .where({ id: req.params.id, user_id: userId })
      .update({ status: 'removed' });

    if (updated === 0) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Card Not Found',
        status: 404,
        detail: 'Card not found.',
      });
      return;
    }

    res.json({ success: true, data: { message: 'Card removed.' } });
  } catch (error) {
    logger.error('Failed to remove card', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to remove card.',
    });
  }
});

// --- PATCH /cards/:id/primary ---
cardsRouter.patch('/:id/primary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    await db.transaction(async (trx) => {
      // Verify target card exists before modifying any data
      const targetCard = await trx('user_cards')
        .where({ id: req.params.id, user_id: userId, status: 'active' })
        .first();

      if (!targetCard) {
        res.status(404).json({
          type: 'https://api.neobank.io/errors/not-found',
          title: 'Card Not Found',
          status: 404,
          detail: 'Card not found.',
        });
        return;
      }

      // Unset existing primary cards
      await trx('user_cards')
        .where({ user_id: userId, is_primary: true })
        .update({ is_primary: false });

      // Set new primary
      await trx('user_cards')
        .where({ id: req.params.id, user_id: userId })
        .update({ is_primary: true });
    });

    // Only send success if response hasn't been sent (404 case)
    if (!res.headersSent) {
      res.json({ success: true, data: { message: 'Primary card updated.' } });
    }
  } catch (error) {
    logger.error('Failed to set primary card', { error: (error as Error).message });
    if (!res.headersSent) {
      res.status(500).json({
        type: 'https://api.neobank.io/errors/internal',
        title: 'Internal Error',
        status: 500,
        detail: 'Failed to set primary card.',
      });
    }
  }
});
