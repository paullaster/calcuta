import type { IDataBase } from "../../entities/IDb-interface.ts";
import { Paper } from "./models/paper.ts";
import { db } from "./index.ts";
import { papers } from "./schema.ts";
import { eq } from "drizzle-orm";

export class PaperDB implements IDataBase {
    constructor() { }

    async getAllPapers() {
        return await db.select().from(papers);
    }

    async findPaper(typeCode: string, grammage: number) {
        let query = db.select().from(papers).where(eq(papers.code, typeCode));
        
        const allMatchingTypes = await query;
        
        // Find exact grammage match if possible
        let paperData = allMatchingTypes.find(p => p.defaultGrammage === grammage);
        
        // Fallback to first available if no exact match (or closest? for now first is safer than failing)
        if (!paperData && allMatchingTypes.length > 0) {
            paperData = allMatchingTypes[0];
        }
        
        if (!paperData) {
            throw new Error(`Unknown paper type: ${typeCode}`);
        }

        return new Paper(
            paperData.name,
            paperData.code,
            grammage || paperData.defaultGrammage,
            Number(paperData.burstIndex),
            Number(paperData.rctFactor),
            Number(paperData.co2PerKg),
            paperData.isLiner
        );
    }
}