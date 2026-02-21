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

    // Calculate Board Properties (BST, ECT)
    calculateBST(req: Request, res: Response) {
        try {
            const { notation, unit = 'kPa' } = req.body;

            if (!notation) {
                return res.status(400).json({ error: 'Notation is required' });
            }

            const board = this.boardNotationService.parse(notation);
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

    // Calculate Box Properties (BCT)
    calculateBox(req: Request, res: Response) {
        try {
            const { notation, length, width, height, unit = 'kPa' } = req.body;

            if (!notation || !length || !width || !height) {
                return res.status(400).json({ error: 'Notation, length, width, and height are required' });
            }

            const board = this.boardNotationService.parse(notation);
            const burstStrength = board.getBST(unit);
            const ect = board.getECT('kN/m');
            
            // BCT Calculation
            // Perimeter in meters
            const perimeter = 2 * (Number(length) + Number(width)) / 1000;
            // Caliper in meters
            const caliper = board.caliper / 1000;
            
            // McKee Formula: 5.876 * ECT * sqrt(P * h)
            const k = 5.876;
            const bct = k * ect * Math.sqrt(perimeter * caliper);

            res.status(200).json({
                notation,
                dimensions: { length, width, height },
                burstStrength,
                unit,
                ect, // kN/m
                bct: bct, // kN
                bct_kgf: bct * 102, // kgf
                caliper: board.caliper, // mm
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

    // Batch calculate multiple notations
    batchCalculateBST(req: Request, res: Response) {
        const { notations, unit = 'kPa' } = req.body;

        const results = notations.map(notation => {
            try {
                const board = this.boardNotationService.parse(notation);
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
        });

        res.json({ results });
    }
}