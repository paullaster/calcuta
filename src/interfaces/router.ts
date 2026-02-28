import { type Application, Router, type Request, type Response, type NextFunction } from "express";
import { BurstStrength } from "./controllers/burst-strength.ts";
import { BoardNotationParser } from "../app/services/board-notation-parser.ts";
import { PaperDB } from "../infra/database/paper-db.ts";
import { PapersController } from "./controllers/papers.ts";
import { config } from "../config/index.ts";


export interface IApp extends Application {}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = config('app.internalApiKey');

    if (apiKey === expectedKey) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    }
};

export const setRoutes = (app: IApp) => {
    const router: Router = Router();

    // Secure all routes in this router
    router.use(authMiddleware);

    const burstStrengthController = new BurstStrength(new BoardNotationParser(new PaperDB()));

    // Calculate BST from notation
    router.post('/calculate', burstStrengthController.calculateBST.bind(burstStrengthController));
    // Calculate Box Properties (BCT)
    router.post('/calculate-box', burstStrengthController.calculateBox.bind(burstStrengthController));
    // Batch calculate multiple notations
    router.post('/batch-calculate', burstStrengthController.batchCalculateBST.bind(burstStrengthController));

    const paperController = new PapersController(new PaperDB());
    // Get all paper types
    router.get('/papers', paperController.getAllPaperTypes.bind(paperController));
    // Calculate RCT for specific paper
    router.post('/calculate-rct', paperController.calculatePaperRCT.bind(paperController));

    app.use('/api', router);
}




