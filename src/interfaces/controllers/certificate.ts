import type { Request, Response } from "express";
import { CertificateGenerator } from "../../app/services/certificate-generator.ts";
import { BoardNotationParser } from "../../app/services/board-notation-parser.ts";

export class CertificateController {
    private generator = new CertificateGenerator();

    constructor(private boardNotationService: BoardNotationParser) { }

    /**
     * @openapi
     * /api/generate-certificate:
     *   post:
     *     summary: Generate a Carbon Footprint & Structural Certificate PDF
     *     tags: [Sustainability]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [notation, length, width, height]
     *             properties:
     *               notation:
     *                 type: string
     *                 example: "125K/127B/125K"
     *               length:
     *                 type: number
     *               width:
     *                 type: number
     *               height:
     *                 type: number
     *               auditId:
     *                 type: number
     *     responses:
     *       200:
     *         description: PDF file stream
     *         content:
     *           application/pdf:
     *             schema:
     *               type: string
     *               format: binary
     */
    async generate(req: Request, res: Response) {
        try {
            const { notation, length, width, height, auditId } = req.body;

            if (!notation || !length || !width || !height) {
                return res.status(400).json({ error: 'Notation, length, width, and height are required' });
            }

            // Recalculate physics to ensure certificate accuracy
            const board = await this.boardNotationService.parse(notation);
            const ect = board.getECT('kN/m');
            
            // BCT (McKee)
            const perimeter = (2 * (Number(length) + Number(width))) / 1000;
            const caliperMeters = board.caliper / 1000;
            const bct = 5.876 * ect * Math.sqrt(perimeter * caliperMeters) * 102; // kgf

            // Sustainability
            const w_b = (2 * (Number(length) + Number(width)) + 35) / 1000;
            const h_b = (Number(width) + Number(height)) / 1000;
            const area_m2 = w_b * h_b;
            
            const totalCO2 = board.calculateTotalCO2(area_m2);
            
            // Recycled Content Calc
            let totalRecycledWeight = 0;
            board.layers.forEach(l => {
                if (l.paper.isRecycled) { // Assume isRecycled prop is now on Paper model (added in Phase 4)
                    const tur = l.isLiner ? 1.0 : (l.typeCode === 'B' ? 1.35 : (l.typeCode === 'C' ? 1.45 : 1.20)); // Approximate TUR re-lookup
                    totalRecycledWeight += l.paper.grammage * tur;
                }
            });
            const recycledContent = (totalRecycledWeight / board.totalGrammage) * 100;

            const pdfBuffer = await this.generator.generate({
                notation,
                bct,
                ect,
                dimensions: { length, width, height },
                totalCO2,
                recycledContent,
                isEcoFriendly: recycledContent > 70 && totalCO2 < (area_m2 * 0.5),
                auditId,
                date: new Date()
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=certificate-${Date.now()}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
}
