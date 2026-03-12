CREATE TABLE "audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_type" text NOT NULL,
	"input_data" jsonb NOT NULL,
	"output_data" jsonb NOT NULL,
	"environmental_factors" jsonb,
	"performed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"tur" numeric(10, 2) NOT NULL,
	"thickness" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flutes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_liner" boolean DEFAULT true NOT NULL,
	"burst_index" numeric(10, 2) NOT NULL,
	"default_grammage" integer NOT NULL,
	"rct_factor" numeric(10, 3) NOT NULL,
	"cost_per_tonne" numeric(10, 2) DEFAULT '0.00',
	"inventory_available" numeric(10, 2) DEFAULT '0.00',
	"is_recycled" integer DEFAULT 0,
	"co2_per_kg" numeric(10, 3) DEFAULT '0.000',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "code_grammage_idx" UNIQUE("code","default_grammage")
);
