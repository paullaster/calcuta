import type { Request, Response } from "express";
import { PaperDB } from "../../infra/database/paper-db.ts";

export class PapersController {
    constructor(private paperDB: PaperDB) { }

    getAllPaperTypes(req: Request, res: Response) {
        res.status(200).json(this.paperDB.papers);
    }
}