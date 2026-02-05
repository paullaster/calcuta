import type { IDataBase } from "../../entities/IDb-interface.ts";
import { Paper } from "./models/paper.ts";

export class PaperDB implements IDataBase {
    papers: Array<{ type: string; name: string; burstIndex: number; defaultGrammage: number }>
    constructor() {
        this.papers = [
            { type: 'K', name: 'Brown Kraft', burstIndex: 4.0, defaultGrammage: 125 },
            { type: 'WK', name: 'White Kraft', burstIndex: 4.5, defaultGrammage: 125 },
            { type: 'TK', name: 'Top Kraft', burstIndex: 2.75, defaultGrammage: 125 },
            { type: 'TL', name: 'Test Liner (Brown)', burstIndex: 2.25, defaultGrammage: 125 },
            { type: 'WTL', name: 'Test Liner (White)', burstIndex: 2.5, defaultGrammage: 125 },

            // Fluting types (negligible BST contribution)
            { type: 'B', name: 'B-Flute', burstIndex: 0, defaultGrammage: 127 },
            { type: 'C', name: 'C-Flute', burstIndex: 0, defaultGrammage: 140 },
            { type: 'E', name: 'E-Flute', burstIndex: 0, defaultGrammage: 115 }
        ]
    }

    findPaper(typeCode: string, grammage: number) {
        let paper = this.papers.find((p) => p.type === typeCode);
        
        if (!paper) {
            // Default to Brown Kraft if unknown
            paper = this.papers.find(p => p.type === 'K');
        }
        return new Paper(
            paper.name,
            typeCode,
            grammage || paper.defaultGrammage,
            paper.burstIndex
        );
    }
}