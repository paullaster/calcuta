/**
 * SafetyFactorService handles the calculation of BCT degradation 
 * based on environmental factors like humidity and storage time.
 */
export class SafetyFactorService {
    
    /**
     * Calculates the humidity factor (degradation).
     * Based on industry standard curves where 50% RH = 1.0
     * @param rh Relative Humidity percentage (0-100)
     */
    calculateHumidityFactor(rh: number): number {
        // Approximate factor: 100% RH results in ~30-40% strength (0.35 factor)
        // 50% RH = 1.0
        // Simplified formula: e^(-0.02 * (RH - 50)) for RH > 50
        if (rh <= 50) return 1.0;
        
        // At 90% RH, this gives ~0.45 strength
        return Math.exp(-0.02 * (rh - 50));
    }

    /**
     * Calculates the storage time factor.
     * Corrugated board loses strength over time due to "creep".
     * @param days Number of days in storage
     */
    calculateStorageFactor(days: number): number {
        if (days <= 0) return 1.0;
        
        // Industry average loss:
        // 10 days -> 75% strength (0.75)
        // 30 days -> 60% strength (0.60)
        // 90 days -> 50% strength (0.50)
        // Logarithmic decay model
        return Math.max(0.45, 1 - 0.1 * Math.log10(days + 1) * 2.5);
    }

    /**
     * Calculates the combined environmental degradation factor.
     */
    getCombinedFactor(rh: number, days: number): number {
        const hFactor = this.calculateHumidityFactor(rh);
        const sFactor = this.calculateStorageFactor(days);
        
        return hFactor * sFactor;
    }
}