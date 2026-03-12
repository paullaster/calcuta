import type { Request, Response } from "express";
import { PaperDB } from "../../infra/database/paper-db.ts";

import { db } from "../../infra/database/index.ts";
import { papers } from "../../infra/database/schema.ts";
import { eq, ilike, or, sql } from "drizzle-orm";

export class PapersController {
    constructor(private paperDB: PaperDB) { }

/**
 * @openapi
 * /api/papers:
 *   get:
 *     summary: Get all available paper types and grammages with search support
 *     tags: [Material Database]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or code
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of papers
 */
    async getAllPaperTypes(req: Request, res: Response) {
        try {
            const { search, limit = 100 } = req.query;
            
            let query = db.select().from(papers);
            
            if (search) {
                const searchPattern = `%${search}%`;
                query = query.where(
                    or(
                        ilike(papers.code, searchPattern),
                        ilike(papers.name, searchPattern)
                    )
                ) as any;
            }

            const results = await query.limit(Number(limit));
            res.status(200).json(results);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

/**
 * @openapi
 * /api/calculate-rct:
 *   post:
 *     summary: Calculate Ring Crush Test (RCT) for a specific paper
 *     tags: [Engineering]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, grammage]
 *             properties:
 *               type:
 *                 type: string
 *                 example: "K"
 *               grammage:
 *                 type: number
 *                 example: 125
 *     responses:
 *       200:
 *         description: RCT calculation result
 */
    async calculatePaperRCT(req: Request, res: Response) {
        const { type, grammage } = req.body;
        
        try {
            const paper = await this.paperDB.findPaper(type, grammage);
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