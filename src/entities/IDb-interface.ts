import { Paper } from "../infra/database/models/paper.ts";

export interface IDataBase {
    findPaper(typeCode: string, grammage: number): Promise<Paper>
}