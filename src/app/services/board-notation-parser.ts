import type { IDataBase } from "../../entities/IDb-interface.ts";
import { Board } from "../../infra/database/models/board.ts";

export class BoardNotationParser {
    constructor( private paperDatabase: IDataBase) { }
    async parse(notation: string) {
        // Support both pipe (|) and forward slash (/) as separators
        const parts = notation.split(/[|\/]/);
        const layers = [];

        for (const part of parts) {
            const layer = await this.parseLayer(part.trim());
            if (layer) layers.push(layer);
        }

        if (layers.length === 0) {
            throw new Error(`Invalid board notation: "${notation}". Correct format: "125K/127B/125K" or "125K|127B|125K"`);
        }

        return new Board(layers);
    }
    async parseLayer(notation: string) {
        // Extract grammage and type
        const match = notation.match(/^(\d+)([a-zA-Z]+)$/);
        if (!match) return null;

        const grammage = parseInt(match[1]);
        const typeCode = match[2].toUpperCase();

        // Find paper in database
        const paper = await this.paperDatabase.findPaper(typeCode, grammage);

        return {
            grammage,
            typeCode,
            paper,
            isLiner: paper ? paper.isLiner : !['B', 'C', 'E', 'EB', 'A', 'F'].includes(typeCode)
        };
    }
}