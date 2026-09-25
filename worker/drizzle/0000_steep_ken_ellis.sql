CREATE TABLE "agent_config_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"weights" jsonb NOT NULL,
	"jev_model_version" text NOT NULL,
	"jev_prompt_version" text NOT NULL,
	"active_from" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"assets_scanned" integer DEFAULT 0 NOT NULL,
	"signals_processed" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"symbol" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stock_token_address" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_stock_token_address_unique" UNIQUE("stock_token_address")
);
--> statement-breakpoint
CREATE TABLE "jev_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"symbol" text NOT NULL,
	"decision" text NOT NULL,
	"confidence" double precision NOT NULL,
	"signals" jsonb NOT NULL,
	"model_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launch_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"pairing_candidate_id" text NOT NULL,
	"stage" text NOT NULL,
	"readiness" text NOT NULL,
	"checks_passed" integer DEFAULT 0 NOT NULL,
	"checks_total" integer DEFAULT 8 NOT NULL,
	"stage_deadline_at" timestamp with time zone NOT NULL,
	"transaction_status" text DEFAULT 'NOT_SUBMITTED' NOT NULL,
	CONSTRAINT "launch_candidates_pairing_candidate_id_unique" UNIQUE("pairing_candidate_id")
);
--> statement-breakpoint
CREATE TABLE "launch_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"launch_candidate_id" text NOT NULL,
	"stage_label" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"price" double precision NOT NULL,
	"volume_24h" double precision NOT NULL,
	"volatility" double precision NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meme_concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tags" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_events" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"cycle_id" text NOT NULL,
	"previous_state" jsonb NOT NULL,
	"observed_change" text NOT NULL,
	"decision" text,
	"current_state" jsonb NOT NULL,
	"evidence_refs" jsonb NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_scores" (
	"cycle_id" text NOT NULL,
	"symbol" text NOT NULL,
	"market_momentum" double precision NOT NULL,
	"narrative_momentum" double precision NOT NULL,
	"social_velocity" double precision NOT NULL,
	"cultural_relevance" double precision NOT NULL,
	"meme_compatibility" double precision NOT NULL,
	"crypto_adjacency" double precision NOT NULL,
	"pair_compatibility" double precision NOT NULL,
	"score" double precision NOT NULL,
	CONSTRAINT "opportunity_scores_cycle_id_symbol_pk" PRIMARY KEY("cycle_id","symbol")
);
--> statement-breakpoint
CREATE TABLE "pairing_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"meme_symbol" text NOT NULL,
	"thesis" jsonb NOT NULL,
	"components" jsonb NOT NULL,
	"pairing_score" double precision NOT NULL,
	"lifecycle_state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairing_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"pairing_candidate_id" text NOT NULL,
	"decision" text NOT NULL,
	"confidence" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairing_history" (
	"id" text PRIMARY KEY NOT NULL,
	"pairing_candidate_id" text NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"actor" text NOT NULL,
	"transitioned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"cycle_id" text,
	"subject_type" text,
	"subject_id" text,
	"payload" jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"actor" text DEFAULT 'JEVO_AGENT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"latency_ms" integer NOT NULL,
	"error" text,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rank_history" (
	"cycle_id" text NOT NULL,
	"symbol" text NOT NULL,
	"current_rank" integer NOT NULL,
	"previous_rank" integer,
	"opportunity_score" double precision NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rank_history_cycle_id_symbol_pk" PRIMARY KEY("cycle_id","symbol")
);
--> statement-breakpoint
CREATE TABLE "signal_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"kind" text NOT NULL,
	"magnitude" double precision NOT NULL,
	"label" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jev_decisions" ADD CONSTRAINT "jev_decisions_symbol_assets_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."assets"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launch_candidates" ADD CONSTRAINT "launch_candidates_pairing_candidate_id_pairing_candidates_id_fk" FOREIGN KEY ("pairing_candidate_id") REFERENCES "public"."pairing_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launch_cycles" ADD CONSTRAINT "launch_cycles_launch_candidate_id_launch_candidates_id_fk" FOREIGN KEY ("launch_candidate_id") REFERENCES "public"."launch_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_symbol_assets_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."assets"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_scores" ADD CONSTRAINT "opportunity_scores_symbol_assets_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."assets"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_candidates" ADD CONSTRAINT "pairing_candidates_symbol_assets_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."assets"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_decisions" ADD CONSTRAINT "pairing_decisions_pairing_candidate_id_pairing_candidates_id_fk" FOREIGN KEY ("pairing_candidate_id") REFERENCES "public"."pairing_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairing_history" ADD CONSTRAINT "pairing_history_pairing_candidate_id_pairing_candidates_id_fk" FOREIGN KEY ("pairing_candidate_id") REFERENCES "public"."pairing_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_history" ADD CONSTRAINT "rank_history_symbol_assets_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."assets"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_observations" ADD CONSTRAINT "signal_observations_symbol_assets_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."assets"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_jev_decisions_cycle_symbol" ON "jev_decisions" USING btree ("cycle_id","symbol");--> statement-breakpoint
CREATE INDEX "idx_launch_cycles_candidate_stage" ON "launch_cycles" USING btree ("launch_candidate_id","stage_label");--> statement-breakpoint
CREATE INDEX "idx_market_snapshots_symbol_captured_at" ON "market_snapshots" USING btree ("symbol","captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_memory_events_subject_recorded" ON "memory_events" USING btree ("subject_type","subject_id","recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_pairing_candidates_symbol" ON "pairing_candidates" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_pairing_candidates_lifecycle" ON "pairing_candidates" USING btree ("lifecycle_state");--> statement-breakpoint
CREATE INDEX "idx_pairing_decisions_candidate_created" ON "pairing_decisions" USING btree ("pairing_candidate_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_pairing_history_candidate_transitioned" ON "pairing_history" USING btree ("pairing_candidate_id","transitioned_at");--> statement-breakpoint
CREATE INDEX "idx_protocol_events_created_at" ON "protocol_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_protocol_events_event_type" ON "protocol_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_protocol_events_cycle_id" ON "protocol_events" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_provider_runs_provider_ran_at" ON "provider_runs" USING btree ("provider","ran_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_rank_history_symbol_cycle" ON "rank_history" USING btree ("symbol","cycle_id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_rank_history_cycle_rank" ON "rank_history" USING btree ("cycle_id","current_rank");--> statement-breakpoint
CREATE INDEX "idx_signal_observations_symbol_captured_at" ON "signal_observations" USING btree ("symbol","captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_signal_observations_kind" ON "signal_observations" USING btree ("kind");