import type { Request, Response } from "express";
import { PaperDB } from "../../infra/database/paper-db.ts";
import { Board } from "../../infra/database/models/board.ts";
import { Paper } from "../../infra/database/models/paper.ts";

export class CostOptimizer {
    constructor(private paperDB: PaperDB) { }

/**
 * @openapi
 * /api/optimize:
 *   post:
 *     summary: Find lowest-cost or lowest-carbon material combinations
 *     tags: [Optimization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetBCT, length, width, height]
 *             properties:
 *               targetBCT:
 *                 type: number
 *                 description: "Target Box Compression strength (kgf)"
 *                 example: 400
 *               length:
 *                 type: number
 *                 example: 300
 *               width:
 *                 type: number
 *                 example: 200
 *               height:
 *                 type: number
 *                 example: 200
 *               safetyFactor:
 *                 type: number
 *                 default: 1.0
 *               sortBy:
 *                 type: string
 *                 enum: [cost, co2]
 *                 default: cost
 *               onlyRecycled:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: List of ranked recommendations
 */
    async optimize(req: Request, res: Response) {
        try {
            const { 
                targetBCT, 
                length, 
                width, 
                height, 
                thickness, 
                safetyFactor = 1.0,
                sortBy = 'cost', // 'cost' or 'co2'
                maxResults = 10,
                onlyRecycled = false
            } = req.body;

            if (!targetBCT || !length || !width || !height) {
                return res.status(400).json({ error: 'targetBCT, length, width, and height are required' });
            }

            const requiredBCT = Number(targetBCT) * Number(safetyFactor);
            const allPapers = await this.paperDB.getAllPapers();
            
            // Categorize papers for efficient solving
            const liners = allPapers.filter(p => p.isLiner && (!onlyRecycled || p.isRecycled === 1));
            const mediums = allPapers.filter(p => !p.isLiner && (!onlyRecycled || p.isRecycled === 1));

            // Standard flute geometries (B, C, E)
            const flutes = [
                { code: 'B', tur: 1.35, thickness: 3.0 },
                { code: 'C', tur: 1.45, thickness: 4.0 },
                { code: 'E', tur: 1.20, thickness: 2.0 }
            ];

            const candidates = [];

            // Blank Area Calculation
            const w_b = (2 * (Number(length) + Number(width)) + 35) / 1000;
            const h_b = (Number(width) + Number(height)) / 1000;
            const area_m2 = w_b * h_b;

            // Iterate through possible combinations (Outer Liner / Flute / Inner Liner)
            for (const outer of liners) {
                for (const inner of liners) {
                    for (const fluteGeom of flutes) {
                        for (const medium of mediums) {
                            
                            const outerPaper = new Paper(outer.name, outer.code, outer.defaultGrammage, Number(outer.burstIndex), Number(outer.rctFactor), Number(outer.co2PerKg));
                            const innerPaper = new Paper(inner.name, inner.code, inner.defaultGrammage, Number(inner.burstIndex), Number(inner.rctFactor), Number(inner.co2PerKg));
                            const mediumPaper = new Paper(medium.name, medium.code, medium.defaultGrammage, Number(medium.burstIndex), Number(medium.rctFactor), Number(medium.co2PerKg));

                            const layers = [
                                { isLiner: true, paper: outerPaper, typeCode: outer.code },
                                { isLiner: false, paper: mediumPaper, typeCode: fluteGeom.code },
                                { isLiner: true, paper: innerPaper, typeCode: inner.code }
                            ];

                            const board = new Board(layers);
                            const ect = board.getECT('kN/m');
                            
                            // BCT Calculation (McKee)
                            const perimeter = (2 * (Number(length) + Number(width))) / 1000;
                            const usedCaliper = thickness ? Number(thickness) : board.caliper;
                            const caliperMeters = usedCaliper / 1000;
                            const bct = 5.876 * ect * Math.sqrt(perimeter * caliperMeters);

                            // Convert BCT to kgf for comparison
                            const bctKgf = bct * 102;

                            if (bctKgf >= requiredBCT) {
                                // Sustainability (Phase 4)
                                const totalCO2 = board.calculateTotalCO2(area_m2);
                                const recycledContentPercentage = (
                                    (outer.isRecycled ? outer.defaultGrammage : 0) + 
                                    (inner.isRecycled ? inner.defaultGrammage : 0) + 
                                    (medium.isRecycled ? medium.defaultGrammage * fluteGeom.tur : 0)
                                ) / board.totalGrammage * 100;

                                // Financials (Phase 3)
                                const outerCost = (Number(outer.costPerTonne) || 900) * (outerPaper.grammage / 1000 * area_m2);
                                const innerCost = (Number(inner.costPerTonne) || 850) * (innerPaper.grammage / 1000 * area_m2);
                                const mediumCost = (Number(medium.costPerTonne) || 750) * (mediumPaper.grammage / 1000 * fluteGeom.tur * area_m2);
                                const totalCostPerBox = outerCost + innerCost + mediumCost;

                                candidates.push({
                                    notation: `${outerPaper.grammage}${outerPaper.type}/${mediumPaper.grammage}${fluteGeom.code}/${innerPaper.grammage}${innerPaper.type}`,
                                    technical: {
                                        bct: Number(bctKgf.toFixed(2)),
                                        ect: Number(ect.toFixed(2)),
                                        caliper: usedCaliper,
                                        weightKg: Number((board.totalGrammage / 1000 * area_m2).toFixed(3))
                                    },
                                    financial: {
                                        costPerBox: Number(totalCostPerBox.toFixed(4)),
                                        costPer1000: Number((totalCostPerBox * 1000).toFixed(2))
                                    },
                                    sustainability: {
                                        co2KgPerBox: Number(totalCO2.toFixed(4)),
                                        recycledPercentage: Number(recycledContentPercentage.toFixed(1)),
                                        isEcoFriendly: recycledContentPercentage > 75 && totalCO2 < (area_m2 * 0.5)
                                    }
                                });
                            }
                        }
                    }
                }
            }

            // Identify a 'Standard' reference (e.g., 125K/127B/125K) for savings calculation
            const standardRef = candidates.find(c => c.notation === '125K/127B/125K') || candidates[candidates.length - 1];
            
            const resultsWithSavings = candidates.map(c => ({
                ...c,
                savingsVsStandard: standardRef ? Number((standardRef.financial.costPer1000 - c.financial.costPer1000).toFixed(2)) : 0
            }));

            // Refined Sorting Resolver
            if (sortBy === 'co2') {
                resultsWithSavings.sort((a, b) => a.sustainability.co2KgPerBox - b.sustainability.co2KgPerBox);
            } else {
                resultsWithSavings.sort((a, b) => a.financial.costPerBox - b.financial.costPerBox);
            }

            res.status(200).json({
                searchCriteria: {
                    targetBCT,
                    requiredBCT,
                    safetyFactor,
                    sortBy,
                    onlyRecycled
                },
                boxMetrics: {
                    dimensions: { length, width, height },
                    blankAreaM2: Number(area_m2.toFixed(4)),
                    standardReference: standardRef?.notation || 'N/A'
                },
                recommendations: resultsWithSavings.slice(0, maxResults)
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}