export class Paper {
    name: string;
    type: string;
    grammage: number;
    burstIndex: number;
    rctFactor: number;
    co2PerKg: number;
    isLiner: boolean;

    constructor(name: string, type: string, grammage: number, burstIndex: number, rctFactor: number = 1.0, co2PerKg: number = 0, isLiner: boolean = true) {
        this.name = name;           
        this.type = type;          
        this.grammage = grammage;   
        this.burstIndex = burstIndex; 
        this.rctFactor = rctFactor;
        this.co2PerKg = co2PerKg;
        this.isLiner = isLiner;
    }

    calculateRCT(): number {
        // RCT (kN/m) = (Grammage / 100) * rctFactor
        return (this.grammage / 100) * this.rctFactor;
    }

    calculateCO2(areaM2: number): number {
        // Weight in kg = (Grammage / 1000) * Area
        const weightKg = (this.grammage / 1000) * areaM2;
        return weightKg * this.co2PerKg;
    }
}