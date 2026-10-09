import { Request, Response } from 'express';
import { startHistoricalSync, getHistoricalSync, latestHistoricalSync } from '../services/historicalSync.service';
export async function start(req: Request, res: Response) {
  try {
    if (typeof req.body.center !== 'string' || !req.body.center.trim()) return res.status(400).json({ message: 'Seleccione un centro' });
    const job = await startHistoricalSync(req.body.center.trim(), (req as any).user.email);
    res.status(202).json({ job });
  } catch (error: any) { res.status(400).json({ message: error.message }); }
}
export async function status(req: Request, res: Response) {
  try { res.json({ job: await getHistoricalSync(req.params.id) }); }
  catch (error: any) { res.status(400).json({ message: error.message }); }
}
export async function latest(req: Request, res: Response) {
  try { res.json({ job: await latestHistoricalSync(req.params.center) }); }
  catch (error: any) { res.status(400).json({ message: error.message }); }
}
