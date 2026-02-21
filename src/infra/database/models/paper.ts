export class Paper {
    name: string;
    type: string;
    grammage: number;
    burstIndex: number;
    rctFactor: number;

    constructor(name: string, type: string, grammage: number, burstIndex: number, rctFactor: number = 1.0) {
        this.name = name;           
        this.type = type;          
        this.grammage = grammage;   
        this.burstIndex = burstIndex; 
        this.rctFactor = rctFactor;
    }

    calculateRCT(): number {
        // RCT (kN/m) = (Grammage / 100) * rctFactor
        return (this.grammage / 100) * this.rctFactor;
    }
}