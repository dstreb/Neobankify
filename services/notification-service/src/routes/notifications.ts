import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

export const notificationRouter = Router();

// --- GET /notifications ---
// Returns in-app notifications for the user
notificationRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    // TODO: Fetch from database
    res.json({
      success: true,
      data: [],
      meta: { cursor: null, hasMore: false },
    });
  } catch (error) {
    logger.error('Failed to fetch notifications', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch notifications.',
    });
  }
});

// --- POST /notifications/:id/read ---
notificationRouter.post('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Mark notification as read in database
    res.json({ success: true, data: { message: 'Notification marked as read.' } });
  } catch (error) {
    logger.error('Failed to mark notification', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to mark notification as read.',
    });
  }
});
