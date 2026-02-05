export class Paper {
    name: string;
    type: string;
    grammage: number;
    burstIndex: number;

    constructor(name: string, type: string, grammage: number, burstIndex: number) {
        this.name = name;           
        this.type = type;          
        this.grammage = grammage;   
        this.burstIndex = burstIndex; 
    }
}