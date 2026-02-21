import type { Request, Response } from "express";
import { PaperDB } from "../../infra/database/paper-db.ts";

export class PapersController {
    constructor(private paperDB: PaperDB) { }

    getAllPaperTypes(req: Request, res: Response) {
        res.status(200).json(this.paperDB.papers);
    }

    calculatePaperRCT(req: Request, res: Response) {
        const { type, grammage } = req.body;
        
        try {
            const paper = this.paperDB.findPaper(type, grammage);
            const rct = paper.calculateRCT();
            
            res.status(200).json({
                type: paper.type,
                name: paper.name,
                grammage: paper.grammage,
                rctFactor: paper.rctFactor,
                rct: Number(rct.toFixed(3)),
                unit: 'kN/m'
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}