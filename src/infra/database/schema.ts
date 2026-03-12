import { pgTable, serial, text, decimal, integer, timestamp, jsonb, unique, boolean } from "drizzle-orm/pg-core";

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // e.g., 'K', 'WK', 'TL'
  name: text("name").notNull(),
  isLiner: boolean("is_liner").notNull().default(true), // Determined by code logic
  burstIndex: decimal("burst_index", { precision: 10, scale: 2 }).notNull(),
  defaultGrammage: integer("default_grammage").notNull(),
  rctFactor: decimal("rct_factor", { precision: 10, scale: 3 }).notNull(),
  costPerTonne: decimal("cost_per_tonne", { precision: 10, scale: 2 }).default("0.00"),
  inventoryAvailable: decimal("inventory_available", { precision: 10, scale: 2 }).default("0.00"), // in tonnes
  isRecycled: integer("is_recycled").default(0), // 0 = Virgin, 1 = Recycled
  co2PerKg: decimal("co2_per_kg", { precision: 10, scale: 3 }).default("0.000"), // for Phase 4
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("code_grammage_idx").on(table.code, table.defaultGrammage),
]);

export const flutes = pgTable("flutes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 'B', 'C', 'E'
  tur: decimal("tur", { precision: 10, scale: 2 }).notNull(), // Take-Up Ratio
  thickness: decimal("thickness", { precision: 10, scale: 2 }).notNull(), // mm
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  auditType: text("audit_type").notNull(), // 'BCT_CALC', 'OPTIMIZATION', 'FORENSIC'
  inputData: jsonb("input_data").notNull(),
  outputData: jsonb("output_data").notNull(),
  environmentalFactors: jsonb("environmental_factors"), // Humidity, Storage Time
  performedBy: text("performed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
