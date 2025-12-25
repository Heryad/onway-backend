ALTER TABLE "stores" ADD COLUMN "zone_id" uuid;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_zone_id_city_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."city_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stores_zone_id_idx" ON "stores" USING btree ("zone_id");