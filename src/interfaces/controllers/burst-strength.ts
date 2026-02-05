import type { Request, Response } from "express";
import { BoardNotationParser } from "../../app/services/board-notation-parser.ts";

export class BurstStrength {
    constructor( private boardNotationService: BoardNotationParser) { }

    // Calculate BST from notation
    calculateBST(req: Request, res: Response) {
        try {
            const { notation, unit = 'kPa' } = req.body;

            if (!notation) {
                return res.status(400).json({ error: 'Notation is required' });
            }

            const board = this.boardNotationService.parse(notation);
            const bst = board.getBST(unit);

            res.status(200).json({
                notation,
                burstStrength: bst,
                unit,
                layers: board.layers.map(l => ({
                    grammage: l.grammage,
                    type: l.typeCode,
                    isLiner: l.isLiner,
                    contribution: l.isLiner ? (l.paper.grammage * l.paper.burstIndex) : 0
                }))
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