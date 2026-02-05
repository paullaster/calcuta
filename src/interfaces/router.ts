import { type Application, Router } from "express";
import { BurstStrength } from "./controllers/burst-strength.ts";
import { BoardNotationParser } from "../app/services/board-notation-parser.ts";
import { PaperDB } from "../infra/database/paper-db.ts";
import { PapersController } from "./controllers/papers.ts";


export interface IApp extends Application {}

export const setRoutes = (app: IApp) => {
    const router: Router = Router();

    const burstStrengthController = new BurstStrength(new BoardNotationParser(new PaperDB()));

    // Calculate BST from notation
    router.post('/calculate', burstStrengthController.calculateBST.bind(burstStrengthController));
    // Batch calculate multiple notations
    router.post('/batch-calculate', burstStrengthController.batchCalculateBST.bind(burstStrengthController));

    const paperController = new PapersController(new PaperDB());
    // Get all paper types
    router.get('/papers', paperController.getAllPaperTypes.bind(paperController));

    app.use('/api', router);
}




