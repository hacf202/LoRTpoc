import { presenceService } from '../services/presence.service.js';

export const presenceController = {
  /**
   * POST /api/v1/presence/ping
   * Heartbeat ping from active user browser tab
   */
  async ping(req, res, next) {
    try {
      const { sessionId, page, lang } = req.body || {};
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
      }

      await presenceService.recordHeartbeat({
        sessionId,
        page,
        lang
      });

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/presence/leave
   * Explicit leave ping on tab close / beforeunload
   */
  async leave(req, res, next) {
    try {
      let sessionId = req.body?.sessionId;
      // Also handle text/plain string from navigator.sendBeacon
      if (!sessionId && typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          sessionId = parsed?.sessionId;
        } catch (_) {}
      }

      if (sessionId) {
        await presenceService.removeHeartbeat(sessionId);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/presence/stats
   * Admin-only statistics of concurrent active users
   */
  async getStats(req, res, next) {
    try {
      const stats = await presenceService.getActiveUsersStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};
