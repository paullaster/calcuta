import type { Request, Response } from "express";
import { BoardNotationParser } from "../../app/services/board-notation-parser.ts";

export class BurstStrength {
    constructor( private boardNotationService: BoardNotationParser) { }

    // Helper to convert units (matches logic in Board model but for individual values)
    private convertBST(value: number, unit: string): number {
        const conversions: Record<string, number> = {
            'kPa': value,
            'psi': value / 6.895,
            'kgf/cm2': value / 98.1
        };
        return conversions[unit] || value;
    }

/**
 * @openapi
 * /api/calculate:
 *   post:
 *     summary: Calculate Board Properties (BST, ECT)
 *     tags: [Engineering]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notation]
 *             properties:
 *               notation:
 *                 type: string
 *                 example: "125K/127B/125K"
 *               unit:
 *                 type: string
 *                 enum: [kPa, psi, kgf/cm2]
 *                 default: kPa
 *     responses:
 *       200:
 *         description: Calculation results
 *       400:
 *         description: Missing notation
 *       500:
 *         description: Error processing notation
 */
    async calculateBST(req: Request, res: Response) {
        try {
            const { notation, unit = 'kPa' } = req.body;

            if (!notation) {
                return res.status(400).json({ error: 'Notation is required' });
            }

            const board = await this.boardNotationService.parse(notation);
            const bst = board.getBST(unit);
            const ect = board.getECT('kN/m');

            res.status(200).json({
                notation,
                burstStrength: bst,
                ect: ect,
                unit,
                layers: board.layers.map(l => {
                    let rctContribution = 0;
                    if (l.isLiner) {
                         rctContribution = (l.paper.grammage / 100) * l.paper.rctFactor;
                    } else {
                        const TUR_MAP: Record<string, number> = { 'B': 1.35, 'C': 1.45, 'E': 1.20 };
                        const tur = TUR_MAP[l.typeCode] || 0;
                        rctContribution = (l.paper.grammage / 100) * l.paper.rctFactor * tur;
                    }

                    // Convert individual contribution to the requested unit
                    const rawContrib = l.isLiner ? (l.paper.grammage * l.paper.burstIndex) : 0;
                    const contribution = this.convertBST(rawContrib, unit);

                    return {
                        grammage: l.grammage,
                        type: l.typeCode,
                        isLiner: l.isLiner,
                        contribution,
                        rctContribution
                    };
                })
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

/**
 * @openapi
 * /api/calculate-box:
 *   post:
 *     summary: Calculate Box Compression Test (BCT)
 *     tags: [Engineering]
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
 *               thickness:
 *                 type: number
 *                 description: "Optional manual thickness override (mm)"
 *               unit:
 *                 type: string
 *                 enum: [kPa, psi, kgf/cm2]
 *                 default: kPa
 *     responses:
 *       200:
 *         description: BCT and box metrics
 */
    async calculateBox(req: Request, res: Response) {
        try {
            const { notation, length, width, height, thickness, unit = 'kPa' } = req.body;
            if (!notation || !length || !width || !height) {
                return res.status(400).json({ error: 'Notation, length, width, and height are required' });
            }

            const board = await this.boardNotationService.parse(notation);
            const burstStrength = board.getBST(unit);
            const ect = board.getECT('kN/m');
            
            // BCT Calculation
            // Perimeter in meters
            const perimeter = (2 * (Number(length) + Number(width))) / 1000;
            // Caliper in meters: Use provided thickness if available, otherwise fallback to calculated
            const usedCaliper = thickness ? Number(thickness) : board.caliper;
            const caliperMeters = usedCaliper / 1000;
            
            // McKee Formula: 5.876 * ECT * sqrt(P * h)
            const k = 5.876;
            const bct = k * ect * Math.sqrt(perimeter * caliperMeters);

            // Box Weight Calculation (Estimation for RSC)
            // Formula from hand-calc: Weight = G * W_B * H_B
            // W_B (Blank width/length in m) = (2 * (L + W) + 35) / 1000
            // H_B (Blank height in m) = (W + H) / 1000
            // G = board total grammage in g/m2
            const w_b = (2 * (Number(length) + Number(width)) + 35) / 1000;
            const h_b = (Number(width) + Number(height)) / 1000;
            const weight_g = (board.totalGrammage * w_b * h_b);
            const weight_kg = weight_g / 1000;

            res.status(200).json({
                notation,
                dimensions: { length, width, height },
                burstStrength,
                unit,
                ect, // kN/m
                bct: bct, // kN
                bct_kgf: bct * 102, // kgf
                caliper: usedCaliper, // mm
                caliperFallback: board.caliper, // mm
                totalGrammage: board.totalGrammage, // g/m2
                weight_g: weight_g,
                weight_kg: weight_kg,
                layers: board.layers.map(l => {
                    const TUR_MAP: Record<string, number> = { 'B': 1.35, 'C': 1.45, 'E': 1.20 };
                    const tur = TUR_MAP[l.typeCode] || 1.0;
                    const paperRCT = (l.paper.grammage / 100) * l.paper.rctFactor;
                    const rctContribution = l.isLiner ? paperRCT : paperRCT * tur;

                    const rawContrib = l.isLiner ? (l.paper.grammage * l.paper.burstIndex) : 0;
                    const contribution = this.convertBST(rawContrib, unit);

                    return {
                        grammage: l.grammage,
                        type: l.typeCode,
                        isLiner: l.isLiner,
                        contribution,
                        rctContribution
                    };
                })
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

/**
 * @openapi
 * /api/batch-calculate:
 *   post:
 *     summary: Batch calculate multiple notations
 *     tags: [Engineering]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notations]
 *             properties:
 *               notations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["125K/127B/125K", "150K/127C/150K"]
 *               unit:
 *                 type: string
 *                 default: kPa
 *     responses:
 *       200:
 *         description: Array of calculation results
 */
    async batchCalculateBST(req: Request, res: Response) {
        const { notations, unit = 'kPa' } = req.body;

        const results = await Promise.all(notations.map(async (notation) => {
            try {
                const board = await this.boardNotationService.parse(notation);
                return {
                    notation,
                    burstStrength: board.getBST(unit),
                    ect: board.getECT('kN/m'),
                    unit,
                    success: true
                };
            } catch (error) {
                return {
                    notation,
                    error: error.message,
                    success: false
                };
            }
        }));

        res.json({ results });
    }
}