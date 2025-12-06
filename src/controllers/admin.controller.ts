import { Request, Response } from 'express';
import * as adminService from '../services/admin.service.js';

export async function getNotVerifiedClients(req: Request, res: Response) {
  try {
    const clients = await adminService.getNotVerifiedClients();
    res.json({ clients });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message ?? err) });
  }
}

export async function getNotVerifiedLawyers(req: Request, res: Response) {
  try {
    const lawyers = await adminService.getNotVerifiedLawyers();
    res.json({ lawyers });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message ?? err) });
  }
}

export async function verifyClient(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const client = await adminService.verifyClient(id);
    res.json({ client });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export async function verifyLawyer(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const lawyer = await adminService.verifyLawyer(id);
    res.json({ lawyer });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export default { getNotVerifiedClients, getNotVerifiedLawyers, verifyClient, verifyLawyer };
