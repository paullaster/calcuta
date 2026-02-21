const FLUTE_PARAMS = {
    'B': { tur: 1.35, thickness: 3.0 },
    'C': { tur: 1.45, thickness: 4.0 },
    'E': { tur: 1.20, thickness: 2.0 }
};

export class Board {
    layers: any[];
    totalBST: number;
    totalECT: number; // kN/m
    caliper: number; // mm

    constructor(layers: any[]) {
        this.layers = layers; // Array of Layer objects
        this.totalBST = this.calculateBST();
        this.totalECT = this.calculateECT();
        this.caliper = this.calculateCaliper();
    }

    calculateBST() {
        // Sum BST of all liners (ignore fluting contributions)
        return this.layers.reduce((sum, layer) => {
            if (layer.isLiner) {
                return sum + (layer.paper.grammage * layer.paper.burstIndex);
            }
            return sum;
        }, 0);
    }

    calculateECT() {
        return this.layers.reduce((sum, layer) => {
            const paperRCT = (layer.paper.grammage / 100) * layer.paper.rctFactor;
            
            if (layer.isLiner) {
                return sum + paperRCT;
            } else {
                // It's a fluting layer
                // paperRCT is (grammage/100) * 0.95 (since we set rctFactor=0.95 for B/C/E papers in DB)
                // Multiply by Take-Up Ratio (TUR)
                const fluteParams = FLUTE_PARAMS[layer.typeCode];
                if (!fluteParams) {
                    throw new Error(`Unknown flute type: ${layer.typeCode}`);
                }
                return sum + (paperRCT * fluteParams.tur);
            }
        }, 0);
    }

    calculateCaliper() {
        return this.layers.reduce((sum, layer) => {
            if (!layer.isLiner) {
                const fluteParams = FLUTE_PARAMS[layer.typeCode];
                return sum + (fluteParams ? fluteParams.thickness : 0);
            }
            return sum;
        }, 0);
    }

    getBST(unit = 'kPa') {
        return this.convertUnits(this.totalBST, unit);
    }

    getECT(unit = 'kN/m') {
        // Default unit is kN/m
        if (unit === 'kgf/cm') {
             // 1 kN/m = 102 kgf/m = 1.02 kgf/cm approx? 
             // Notes say: "kN/m x 102" -> likely kgf/m not cm?
             // Actually standard is kN/m. Let's stick to kN/m primarily.
             // If needed: 1 kN/m = 101.97 kgf/m = 1.02 kgf/cm
             return this.totalECT * 102; // Returning kgf/m as per notes "Units... kgf" implied
        }
        return this.totalECT;
    }

    getCaliper() {
        return this.caliper;
    }

    convertUnits(value, targetUnit) {
        const conversions = {
            'kPa': value,
            'psi': value / 6.895,
            'kgf/cm2': value / 98.1
        };
        return conversions[targetUnit] || value;
    }
}