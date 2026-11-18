import { Request, Response } from 'express';
import { startAttentionBatch, getAttentionBatch, latestAttentionBatch } from '../services/attentionBatchJob.service';
export async function start(req: Request, res: Response) {
  try {
    const { center, patientIds, month, year } = req.body;
    if (typeof center !== 'string' || !center.trim()) throw new Error('Selecciona un centro');
    const job = await startAttentionBatch(center.trim(), patientIds, Number(month), Number(year));
    res.status(202).json({ job });
  } catch (error: any) { res.status(error.statusCode || 400).json({ message: error.message }); }
}
export async function status(req: Request, res: Response) {
  try { res.json({ job: await getAttentionBatch(req.params.id) }); }
  catch (error: any) { res.status(400).json({ message: error.message }); }
}
export async function latest(req: Request, res: Response) {
  try { res.json({ job: await latestAttentionBatch(req.params.center) }); }
  catch (error: any) { res.status(400).json({ message: error.message }); }
}
