import { db } from "./index.ts";
import { papers, flutes } from "./schema.ts";

async function seed() {
  console.log("🌱 Seeding database...");

  const flutingTypes = ['B', 'C', 'E', 'EB', 'A', 'F'];

  // Seed Papers with realistic cost and CO2 data across various grammages
  const paperData = [
    // Brown Kraft (Virgin)
    { code: 'K', name: 'Brown Kraft 115', burstIndex: "4.0", defaultGrammage: 115, rctFactor: "1.15", costPerTonne: "960.00", isRecycled: 0, co2PerKg: "0.850" },
    { code: 'K', name: 'Brown Kraft 125', burstIndex: "4.0", defaultGrammage: 125, rctFactor: "1.15", costPerTonne: "950.00", isRecycled: 0, co2PerKg: "0.850" },
    { code: 'K', name: 'Brown Kraft 150', burstIndex: "4.0", defaultGrammage: 150, rctFactor: "1.15", costPerTonne: "940.00", isRecycled: 0, co2PerKg: "0.850" },
    { code: 'K', name: 'Brown Kraft 175', burstIndex: "4.0", defaultGrammage: 175, rctFactor: "1.15", costPerTonne: "930.00", isRecycled: 0, co2PerKg: "0.850" },
    { code: 'K', name: 'Brown Kraft 200', burstIndex: "4.0", defaultGrammage: 200, rctFactor: "1.15", costPerTonne: "920.00", isRecycled: 0, co2PerKg: "0.850" },

    // White Kraft (Virgin)
    { code: 'WK', name: 'White Kraft 125', burstIndex: "4.5", defaultGrammage: 125, rctFactor: "1.15", costPerTonne: "1050.00", isRecycled: 0, co2PerKg: "0.920" },
    { code: 'WK', name: 'White Kraft 140', burstIndex: "4.5", defaultGrammage: 140, rctFactor: "1.15", costPerTonne: "1040.00", isRecycled: 0, co2PerKg: "0.920" },

    // Top Kraft (Semi-recycled)
    { code: 'TK', name: 'Top Kraft 125', burstIndex: "2.75", defaultGrammage: 125, rctFactor: "1.13", costPerTonne: "880.00", isRecycled: 1, co2PerKg: "0.550" },
    { code: 'TK', name: 'Top Kraft 150', burstIndex: "2.75", defaultGrammage: 150, rctFactor: "1.13", costPerTonne: "870.00", isRecycled: 1, co2PerKg: "0.550" },

    // Test Liner (Brown, Recycled)
    { code: 'TL', name: 'Test Liner 112', burstIndex: "2.25", defaultGrammage: 112, rctFactor: "1.00", costPerTonne: "830.00", isRecycled: 1, co2PerKg: "0.480" },
    { code: 'TL', name: 'Test Liner 125', burstIndex: "2.25", defaultGrammage: 125, rctFactor: "1.00", costPerTonne: "820.00", isRecycled: 1, co2PerKg: "0.480" },
    { code: 'TL', name: 'Test Liner 150', burstIndex: "2.25", defaultGrammage: 150, rctFactor: "1.00", costPerTonne: "810.00", isRecycled: 1, co2PerKg: "0.480" },
    { code: 'TL', name: 'Test Liner 175', burstIndex: "2.25", defaultGrammage: 175, rctFactor: "1.00", costPerTonne: "800.00", isRecycled: 1, co2PerKg: "0.480" },

    // Fluting Medium (Recycled)
    { code: 'B', name: 'B-Flute Medium 112', burstIndex: "0.00", defaultGrammage: 112, rctFactor: "0.95", costPerTonne: "760.00", isRecycled: 1, co2PerKg: "0.420" },
    { code: 'B', name: 'B-Flute Medium 127', burstIndex: "0.00", defaultGrammage: 127, rctFactor: "0.95", costPerTonne: "750.00", isRecycled: 1, co2PerKg: "0.420" },
    { code: 'B', name: 'B-Flute Medium 150', burstIndex: "0.00", defaultGrammage: 150, rctFactor: "0.95", costPerTonne: "740.00", isRecycled: 1, co2PerKg: "0.420" },

    { code: 'C', name: 'C-Flute Medium 127', burstIndex: "0.00", defaultGrammage: 127, rctFactor: "0.95", costPerTonne: "750.00", isRecycled: 1, co2PerKg: "0.420" },
    { code: 'C', name: 'C-Flute Medium 140', burstIndex: "0.00", defaultGrammage: 140, rctFactor: "0.95", costPerTonne: "750.00", isRecycled: 1, co2PerKg: "0.420" },

    { code: 'E', name: 'E-Flute Medium 115', burstIndex: "0.00", defaultGrammage: 115, rctFactor: "0.95", costPerTonne: "780.00", isRecycled: 1, co2PerKg: "0.440" }
  ];

  for (const paper of paperData) {
    const paperWithLinerFlag = {
      ...paper,
      isLiner: !flutingTypes.includes(paper.code)
    };
    await db.insert(papers).values(paperWithLinerFlag as any).onConflictDoUpdate({
      target: [papers.code, papers.defaultGrammage],
      set: { isLiner: paperWithLinerFlag.isLiner }
    });
  }

  // Seed Flutes
  const fluteData = [
    { code: 'B', tur: "1.35", thickness: "3.00" },
    { code: 'C', tur: "1.45", thickness: "4.00" },
    { code: 'E', tur: "1.20", thickness: "2.00" }
  ];

  for (const flute of fluteData) {
    await db.insert(flutes).values(flute).onConflictDoNothing();
  }

  console.log("✅ Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
