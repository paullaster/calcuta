import type { Request, Response } from "express";
import { db } from "../../infra/database/index.ts";
import { audits } from "../../infra/database/schema.ts";
import { BoardNotationParser } from "../../app/services/board-notation-parser.ts";
import { SafetyFactorService } from "../../app/services/safety-factor.ts";
import { desc } from "drizzle-orm";

export class AuditController {
    private safetyService = new SafetyFactorService();

    constructor(private boardNotationService: BoardNotationParser) { }

/**
 * @openapi
 * /api/forensic-audit:
 *   post:
 *     summary: Perform forensic structural failure analysis
 *     tags: [Audit & Compliance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notation, length, width, height]
 *             properties:
 *               notation:
 *                 type: string
 *                 example: "125K/127B/125K"
 *               length:
 *                 type: number
 *                 example: 300
 *               width:
 *                 type: number
 *                 example: 200
 *               height:
 *                 type: number
 *                 example: 200
 *               relativeHumidity:
 *                 type: number
 *                 description: "RH percentage at time of failure"
 *                 example: 85
 *               storageDays:
 *                 type: number
 *                 description: "Number of days box was under load"
 *                 example: 30
 *               performedBy:
 *                 type: string
 *                 example: "Inspector 042"
 *     responses:
 *       200:
 *         description: Forensic analysis results and audit ID
 */
    async performForensicAudit(req: Request, res: Response) {
        try {
            const { 
                notation, 
                length, 
                width, 
                height, 
                thickness,
                relativeHumidity = 50,
                storageDays = 0,
                performedBy = 'System'
            } = req.body;

            if (!notation || !length || !width || !height) {
                return res.status(400).json({ error: 'Notation, length, width, and height are required' });
            }

            const board = await this.boardNotationService.parse(notation);
            const ect = board.getECT('kN/m');
            
            // Baseline BCT (McKee)
            const perimeter = (2 * (Number(length) + Number(width))) / 1000;
            const usedCaliper = thickness ? Number(thickness) : board.caliper;
            const caliperMeters = usedCaliper / 1000;
            const baselineBct = 5.876 * ect * Math.sqrt(perimeter * caliperMeters);

            // Environmental Degradation
            const envFactor = this.safetyService.getCombinedFactor(Number(relativeHumidity), Number(storageDays));
            const degradedBct = baselineBct * envFactor;

            const outputData = {
                baselineBct: Number(baselineBct.toFixed(2)),
                degradedBct: Number(degradedBct.toFixed(2)),
                degradationFactor: Number(envFactor.toFixed(3)),
                unit: 'kN'
            };

            // Log Audit (Chain of Custody)
            const [auditRecord] = await db.insert(audits).values({
                auditType: 'FORENSIC',
                inputData: req.body,
                outputData,
                environmentalFactors: { relativeHumidity, storageDays },
                performedBy
            }).returning();

            res.status(200).json({
                auditId: auditRecord.id,
                ...outputData,
                timestamp: auditRecord.createdAt
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

/**
 * @openapi
 * /api/audit-history:
 *   get:
 *     summary: Retrieve history of structural audits
 *     tags: [Audit & Compliance]
 *     responses:
 *       200:
 *         description: List of audit records
 */
    async getAuditHistory(req: Request, res: Response) {
        try {
            const history = await db.select()
                .from(audits)
                .orderBy(desc(audits.createdAt))
                .limit(50);

            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}