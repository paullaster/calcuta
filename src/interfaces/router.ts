import { type Application, Router, type Request, type Response, type NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.ts";
import { BurstStrength } from "./controllers/burst-strength.ts";
import { BoardNotationParser } from "../app/services/board-notation-parser.ts";
import { PaperDB } from "../infra/database/paper-db.ts";
import { PapersController } from "./controllers/papers.ts";
import { CostOptimizer } from "./controllers/cost-optimizer.ts";
import { AuditController } from "./controllers/audit.ts";
import { CertificateController } from "./controllers/certificate.ts";
import { config } from "../config/index.ts";


export interface IApp extends Application {}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Allow swagger docs without auth
    if (req.path === '/api-docs' || req.path.startsWith('/api-docs/')) {
        return next();
    }

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

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Secure all routes in this router
    router.use(authMiddleware);

    const paperDB = new PaperDB();
    const boardNotationParser = new BoardNotationParser(paperDB);
    const burstStrengthController = new BurstStrength(boardNotationParser);

    // Calculate BST from notation
    router.post('/calculate', burstStrengthController.calculateBST.bind(burstStrengthController));
    // Calculate Box Properties (BCT)
    router.post('/calculate-box', burstStrengthController.calculateBox.bind(burstStrengthController));
    // Batch calculate multiple notations
    router.post('/batch-calculate', burstStrengthController.batchCalculateBST.bind(burstStrengthController));

    const paperController = new PapersController(paperDB);
    // Get all paper types
    router.get('/papers', paperController.getAllPaperTypes.bind(paperController));
    // Calculate RCT for specific paper
    router.post('/calculate-rct', paperController.calculatePaperRCT.bind(paperController));

    const costOptimizerController = new CostOptimizer(paperDB);
    // Optimize paper combination for target BCT
    router.post('/optimize', costOptimizerController.optimize.bind(costOptimizerController));

    const auditController = new AuditController(boardNotationParser);
    // Forensic audit account for environmental factors
    router.post('/forensic-audit', auditController.performForensicAudit.bind(auditController));
    // Get audit history for forensic report
    router.get('/audit-history', auditController.getAuditHistory.bind(auditController));

    const certificateController = new CertificateController(boardNotationParser);
    // Generate PDF Certificate
    router.post('/generate-certificate', certificateController.generate.bind(certificateController));

    app.use('/api', router);
}




