export class Board {
    layers: any[];
    totalBST: number;

    constructor(layers: any[]) {
        this.layers = layers; // Array of Layer objects
        this.totalBST = this.calculateBST();
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

    getBST(unit = 'kPa') {
        return this.convertUnits(this.totalBST, unit);
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