import type { IDataBase } from "../../entities/IDb-interface.ts";
import { Paper } from "./models/paper.ts";

export class PaperDB implements IDataBase {
    papers: Array<{ type: string; name: string; burstIndex: number; defaultGrammage: number; rctFactor: number }>
    constructor() {
        this.papers = [
            { type: 'K', name: 'Brown Kraft', burstIndex: 4.0, defaultGrammage: 125, rctFactor: 1.15 },
            { type: 'WK', name: 'White Kraft', burstIndex: 4.5, defaultGrammage: 125, rctFactor: 1.15 },
            { type: 'TK', name: 'Top Kraft', burstIndex: 2.75, defaultGrammage: 125, rctFactor: 1.13 }, // Assuming TK is KT
            { type: 'TL', name: 'Test Liner (Brown)', burstIndex: 2.25, defaultGrammage: 125, rctFactor: 1.0 },
            { type: 'WTL', name: 'Test Liner (White)', burstIndex: 2.5, defaultGrammage: 125, rctFactor: 1.0 },
            { type: 'BL', name: 'Box Liner', burstIndex: 2.25, defaultGrammage: 125, rctFactor: 1.0 }, // Added BL

            // Fluting types (negligible BST contribution, but important for ECT/RCT)
            // Note: When used as fluting medium, the rctFactor is 0.95
            { type: 'B', name: 'B-Flute Medium', burstIndex: 0, defaultGrammage: 127, rctFactor: 0.95 },
            { type: 'C', name: 'C-Flute Medium', burstIndex: 0, defaultGrammage: 140, rctFactor: 0.95 },
            { type: 'E', name: 'E-Flute Medium', burstIndex: 0, defaultGrammage: 115, rctFactor: 0.95 }
        ]
    }

    findPaper(typeCode: string, grammage: number) {
        let paper = this.papers.find((p) => p.type === typeCode);
        
        if (!paper) {
            throw new Error(`Unknown paper type: ${typeCode}`);
        }
        return new Paper(
            paper.name,
            typeCode,
            grammage || paper.defaultGrammage,
            paper.burstIndex,
            paper.rctFactor
        );
    }
}