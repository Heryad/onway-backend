CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"phone_code" varchar(10) NOT NULL,
	"currency" varchar(50) NOT NULL,
	"currency_code" varchar(10) NOT NULL,
	"currency_symbol" varchar(10) NOT NULL,
	"avatar" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"base_delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"prime_delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"free_delivery_threshold" numeric(10, 2),
	"service_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"geo_bounds" jsonb,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"country_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"extra_delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"geo_polygon" jsonb NOT NULL,
	"city_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"avatar" varchar(500),
	"role" varchar(20) DEFAULT 'support' NOT NULL,
	"country_id" uuid,
	"city_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username"),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100),
	"email" varchar(255),
	"phone" varchar(20),
	"avatar" varchar(500),
	"gender" varchar(10),
	"birth_date" date,
	"is_prime" boolean DEFAULT false NOT NULL,
	"prime_expires_at" timestamp with time zone,
	"coins_balance" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"city_id" uuid,
	"country_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "user_oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" varchar(500),
	"refresh_token" varchar(500),
	"token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" varchar(255),
	"device_name" varchar(255),
	"device_type" varchar(50),
	"refresh_token_hash" varchar(255) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" varchar(500),
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100),
	"street" varchar(255) NOT NULL,
	"building" varchar(100),
	"floor" varchar(20),
	"apartment" varchar(20),
	"instructions" varchar(500),
	"type" varchar(20) DEFAULT 'home' NOT NULL,
	"geo_location" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"store_id" uuid,
	"store_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"avatar" varchar(500),
	"vehicle_type" varchar(20) NOT NULL,
	"vehicle_plate" varchar(20),
	"is_online" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"current_location" jsonb,
	"rating" varchar(5) DEFAULT '5.0',
	"total_deliveries" integer DEFAULT 0,
	"zone_id" uuid,
	"city_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_email_unique" UNIQUE("email"),
	CONSTRAINT "drivers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "driver_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"device_id" varchar(255),
	"device_name" varchar(255),
	"device_type" varchar(50),
	"refresh_token_hash" varchar(255) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" varchar(500),
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'assigned' NOT NULL,
	"rejection_reason" varchar(30),
	"rejection_notes" text,
	"batch_id" varchar(50),
	"pickup_sequence" varchar(10),
	"delivery_sequence" varchar(10),
	"distance_km" numeric(10, 2),
	"estimated_minutes" varchar(10),
	"actual_minutes" varchar(10),
	"current_location" jsonb,
	"route_polyline" text,
	"base_fee" numeric(10, 2),
	"distance_bonus" numeric(10, 2) DEFAULT '0',
	"tip_amount" numeric(10, 2) DEFAULT '0',
	"total_earnings" numeric(10, 2),
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"arrived_store_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"arrived_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"completed_deliveries" integer DEFAULT 0 NOT NULL,
	"cancelled_deliveries" integer DEFAULT 0 NOT NULL,
	"total_distance_km" numeric(10, 2),
	"base_fees" numeric(12, 2) NOT NULL,
	"distance_bonuses" numeric(12, 2) DEFAULT '0',
	"tips" numeric(12, 2) DEFAULT '0',
	"incentives" numeric(12, 2) DEFAULT '0',
	"deductions" numeric(12, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"transaction_reference" varchar(255),
	"paid_at" timestamp with time zone,
	"failure_reason" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"avatar" varchar(500),
	"thumbnail" varchar(500),
	"thumbnail_type" varchar(10) DEFAULT 'image',
	"has_special_delivery_fee" boolean DEFAULT false NOT NULL,
	"special_delivery_fee" numeric(10, 2),
	"min_order_amount" numeric(10, 2) DEFAULT '0',
	"discount_type" varchar(20),
	"discount_amount" numeric(10, 2),
	"max_discount_amount" numeric(10, 2),
	"sorting" integer DEFAULT 0 NOT NULL,
	"is_prime" boolean DEFAULT false NOT NULL,
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"working_hours" jsonb,
	"preparation_time" integer DEFAULT 30,
	"rating" numeric(2, 1) DEFAULT '5.0',
	"total_reviews" integer DEFAULT 0,
	"geo_location" jsonb,
	"address" varchar(500),
	"category_display_setting" varchar(20) DEFAULT 'expanded',
	"can_place_order" boolean DEFAULT true NOT NULL,
	"accepts_scheduled_orders" boolean DEFAULT false NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '15.00',
	"city_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'owner' NOT NULL,
	"store_id" uuid NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_auth_email_unique" UNIQUE("email"),
	CONSTRAINT "store_auth_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "store_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_auth_id" uuid NOT NULL,
	"device_id" varchar(255),
	"device_name" varchar(255),
	"refresh_token_hash" varchar(255) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" varchar(500),
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"avatar" varchar(500),
	"sorting" integer DEFAULT 0 NOT NULL,
	"store_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"discount_type" varchar(20),
	"discount_amount" numeric(10, 2),
	"photos" jsonb DEFAULT '[]'::jsonb,
	"max_quantity" integer DEFAULT 10,
	"stock_quantity" integer,
	"out_of_stock" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"nutrition_info" jsonb,
	"preparation_time" integer,
	"sorting" integer DEFAULT 0 NOT NULL,
	"category_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_item_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"options" jsonb NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_selections" integer DEFAULT 0,
	"max_selections" integer DEFAULT 1,
	"sorting" integer DEFAULT 0 NOT NULL,
	"store_item_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_category_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"sorting" integer DEFAULT 0 NOT NULL,
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"completed_orders" integer DEFAULT 0 NOT NULL,
	"cancelled_orders" integer DEFAULT 0 NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_amount" numeric(12, 2) NOT NULL,
	"adjustments" numeric(12, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"transaction_reference" varchar(255),
	"paid_at" timestamp with time zone,
	"failure_reason" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"avatar" varchar(500),
	"sorting" integer DEFAULT 0 NOT NULL,
	"city_id" uuid,
	"country_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"avatar" varchar(500),
	"sorting" integer DEFAULT 0 NOT NULL,
	"coming_soon" boolean DEFAULT false NOT NULL,
	"city_id" uuid,
	"country_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thumbnail" varchar(500) NOT NULL,
	"sorting" integer DEFAULT 0 NOT NULL,
	"type" varchar(20) DEFAULT 'view' NOT NULL,
	"click_url" varchar(500),
	"store_id" uuid,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"city_id" uuid,
	"country_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_address_id" uuid NOT NULL,
	"delivery_address" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"service_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tip_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"has_discount" boolean DEFAULT false NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"promo_code_id" uuid,
	"total" numeric(10, 2) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"payment_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"store_notes" text,
	"delivery_notes" text,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"cancel_reason" varchar(30),
	"cancelled_by" varchar(20),
	"cancellation_notes" text,
	"is_scheduled" boolean DEFAULT false NOT NULL,
	"scheduled_for" timestamp with time zone,
	"coins_awarded" integer DEFAULT 0,
	"coins_used" integer DEFAULT 0,
	"city_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"preparing_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"store_item_id" uuid NOT NULL,
	"item_snapshot" jsonb NOT NULL,
	"selected_addons" jsonb DEFAULT '[]'::jsonb,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"unit_price" numeric(10, 2) NOT NULL,
	"addons_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'included' NOT NULL,
	"remove_reason" text,
	"substituted_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" varchar(30),
	"to_status" varchar(30) NOT NULL,
	"changed_by_type" varchar(20) NOT NULL,
	"changed_by_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"store_item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"selected_addons" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"avatar" varchar(500),
	"gateway" varchar(50),
	"fee" numeric(5, 2) DEFAULT '0',
	"fee_type" varchar(20) DEFAULT 'fixed',
	"country_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sorting" varchar(10) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"payment_option_id" uuid,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"original_amount" numeric(10, 2) NOT NULL,
	"refunded_amount" numeric(10, 2) DEFAULT '0',
	"processing_fee" numeric(10, 2) DEFAULT '0',
	"transaction_id" varchar(255),
	"gateway_response" jsonb,
	"gateway_error" text,
	"refund_transaction_id" varchar(255),
	"refund_reason" text,
	"refunded_by" uuid,
	"refunded_at" timestamp with time zone,
	"city_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"max_discount_amount" numeric(10, 2),
	"max_uses" integer,
	"max_uses_per_user" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0,
	"min_order_amount" numeric(10, 2),
	"first_order_only" boolean DEFAULT false NOT NULL,
	"new_users_only" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"city_id" uuid,
	"country_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promo_code_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"discount_applied" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(500),
	"thumbnail" varchar(500),
	"discount_type" varchar(20) NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"max_discount_amount" numeric(10, 2),
	"has_main_view" boolean DEFAULT false NOT NULL,
	"sorting" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"city_id" uuid,
	"country_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"sorting" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"department" varchar(20) DEFAULT 'general' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"order_id" uuid,
	"user_id" uuid NOT NULL,
	"assigned_admin_id" uuid,
	"city_id" uuid,
	"country_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"body" text NOT NULL,
	"type" varchar(20) DEFAULT 'text' NOT NULL,
	"media_url" varchar(500),
	"sender_type" varchar(20) NOT NULL,
	"user_id" uuid,
	"admin_id" uuid,
	"is_read" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"images" varchar(500),
	"user_id" uuid NOT NULL,
	"store_id" uuid,
	"driver_id" uuid,
	"ticket_id" uuid,
	"order_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"city_id" uuid,
	"country_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"store_id" uuid,
	"admin_id" uuid,
	"type" varchar(10) NOT NULL,
	"media_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"caption" text,
	"product_id" uuid,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"city_id" uuid,
	"country_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(500),
	"thumbnail" varchar(500),
	"members_count" integer DEFAULT 0,
	"supervisor_id" uuid NOT NULL,
	"city_id" uuid,
	"country_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_chat_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"is_muted" boolean DEFAULT false,
	"muted_until" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "group_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text,
	"type" varchar(20) DEFAULT 'text' NOT NULL,
	"media_url" varchar(500),
	"reply_to_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(50) NOT NULL,
	"sender_id" uuid,
	"receiver_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"memo" text,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"city_id" uuid,
	"country_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" varchar(500) NOT NULL,
	"data" jsonb,
	"action_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"is_push_sent" boolean DEFAULT false,
	"push_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid,
	"country_id" uuid,
	"available_languages" jsonb DEFAULT '["en"]'::jsonb,
	"default_language" varchar(10) DEFAULT 'en',
	"coin_rewards_enabled" boolean DEFAULT true,
	"coins_per_order" integer DEFAULT 10,
	"coins_per_referral" integer DEFAULT 50,
	"coins_to_currency_rate" integer DEFAULT 100,
	"social_media" jsonb,
	"support_contacts" jsonb,
	"theme" jsonb,
	"splash_screen_type" varchar(20) DEFAULT 'default',
	"splash_media_url" varchar(500),
	"splash_duration_ms" integer DEFAULT 2000,
	"min_app_version" varchar(20),
	"latest_app_version" varchar(20),
	"force_update" boolean DEFAULT false,
	"maintenance_mode" boolean DEFAULT false,
	"maintenance_message" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" varchar(20) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"action" varchar(30) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"description" text,
	"metadata" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"request_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_index_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"last_synced_id" uuid,
	"last_synced_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'idle' NOT NULL,
	"last_error" varchar(1000),
	"last_error_at" timestamp with time zone,
	"error_count" varchar(10) DEFAULT '0',
	"total_documents" varchar(20) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_index_status_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_zones" ADD CONSTRAINT "city_zones_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_store_item_id_store_items_id_fk" FOREIGN KEY ("store_item_id") REFERENCES "public"."store_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_zone_id_city_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."city_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_sessions" ADD CONSTRAINT "driver_sessions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_orders" ADD CONSTRAINT "driver_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_orders" ADD CONSTRAINT "driver_orders_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_payouts" ADD CONSTRAINT "driver_payouts_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_auth" ADD CONSTRAINT "store_auth_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_sessions" ADD CONSTRAINT "store_sessions_store_auth_id_store_auth_id_fk" FOREIGN KEY ("store_auth_id") REFERENCES "public"."store_auth"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_items" ADD CONSTRAINT "store_items_category_id_store_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."store_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_items" ADD CONSTRAINT "store_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_item_addons" ADD CONSTRAINT "store_item_addons_store_item_id_store_items_id_fk" FOREIGN KEY ("store_item_id") REFERENCES "public"."store_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_item_addons" ADD CONSTRAINT "store_item_addons_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_category_assignments" ADD CONSTRAINT "store_category_assignments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_category_assignments" ADD CONSTRAINT "store_category_assignments_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_payouts" ADD CONSTRAINT "store_payouts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_address_id_user_addresses_id_fk" FOREIGN KEY ("user_address_id") REFERENCES "public"."user_addresses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_item_id_store_items_id_fk" FOREIGN KEY ("store_item_id") REFERENCES "public"."store_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_substituted_item_id_store_items_id_fk" FOREIGN KEY ("substituted_item_id") REFERENCES "public"."store_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_store_item_id_store_items_id_fk" FOREIGN KEY ("store_item_id") REFERENCES "public"."store_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_options" ADD CONSTRAINT "payment_options_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_option_id_payment_options_id_fk" FOREIGN KEY ("payment_option_id") REFERENCES "public"."payment_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_by_admins_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_stores" ADD CONSTRAINT "promotion_stores_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_stores" ADD CONSTRAINT "promotion_stores_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_admins_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_product_id_store_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_group_id_group_chats_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_conversations" ADD CONSTRAINT "group_conversations_group_id_group_chats_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_conversations" ADD CONSTRAINT "group_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "countries_is_active_idx" ON "countries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cities_country_id_idx" ON "cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "cities_is_active_idx" ON "cities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cities_country_active_idx" ON "cities" USING btree ("country_id","is_active");--> statement-breakpoint
CREATE INDEX "city_zones_city_id_idx" ON "city_zones" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "city_zones_city_active_idx" ON "city_zones" USING btree ("city_id","is_active");--> statement-breakpoint
CREATE INDEX "admins_email_idx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admins_role_idx" ON "admins" USING btree ("role");--> statement-breakpoint
CREATE INDEX "admins_is_active_idx" ON "admins" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_city_id_idx" ON "users" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "users_country_id_idx" ON "users" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "users_is_prime_idx" ON "users" USING btree ("is_prime");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_oauth_provider_idx" ON "user_oauth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "user_oauth_user_id_idx" ON "user_oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_sessions_device_idx" ON "user_sessions" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_addresses_user_default_idx" ON "user_addresses" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "user_addresses_city_idx" ON "user_addresses" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_user_type_idx" ON "user_favorites" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "user_favorites_store_idx" ON "user_favorites" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "user_favorites_item_idx" ON "user_favorites" USING btree ("store_item_id");--> statement-breakpoint
CREATE INDEX "drivers_email_idx" ON "drivers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "drivers_phone_idx" ON "drivers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "drivers_city_id_idx" ON "drivers" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "drivers_country_id_idx" ON "drivers" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "drivers_zone_id_idx" ON "drivers" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "drivers_is_online_idx" ON "drivers" USING btree ("is_online");--> statement-breakpoint
CREATE INDEX "drivers_available_idx" ON "drivers" USING btree ("city_id","is_online","is_available");--> statement-breakpoint
CREATE INDEX "driver_sessions_driver_id_idx" ON "driver_sessions" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_sessions_expires_idx" ON "driver_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "driver_orders_order_id_idx" ON "driver_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "driver_orders_driver_id_idx" ON "driver_orders" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_orders_status_idx" ON "driver_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "driver_orders_batch_id_idx" ON "driver_orders" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "driver_orders_driver_status_idx" ON "driver_orders" USING btree ("driver_id","status");--> statement-breakpoint
CREATE INDEX "driver_orders_assigned_at_idx" ON "driver_orders" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "driver_payouts_driver_idx" ON "driver_payouts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_payouts_period_idx" ON "driver_payouts" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "driver_payouts_status_idx" ON "driver_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "driver_payouts_driver_period_idx" ON "driver_payouts" USING btree ("driver_id","period_start");--> statement-breakpoint
CREATE INDEX "stores_city_id_idx" ON "stores" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "stores_country_id_idx" ON "stores" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "stores_is_active_idx" ON "stores" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "stores_is_prime_idx" ON "stores" USING btree ("is_prime");--> statement-breakpoint
CREATE INDEX "stores_is_sponsored_idx" ON "stores" USING btree ("is_sponsored");--> statement-breakpoint
CREATE INDEX "stores_sorting_idx" ON "stores" USING btree ("sorting");--> statement-breakpoint
CREATE INDEX "stores_rating_idx" ON "stores" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "stores_city_active_idx" ON "stores" USING btree ("city_id","is_active");--> statement-breakpoint
CREATE INDEX "store_auth_email_idx" ON "store_auth" USING btree ("email");--> statement-breakpoint
CREATE INDEX "store_auth_store_id_idx" ON "store_auth" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_sessions_store_auth_id_idx" ON "store_sessions" USING btree ("store_auth_id");--> statement-breakpoint
CREATE INDEX "store_sessions_expires_idx" ON "store_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "store_categories_store_id_idx" ON "store_categories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_categories_sorting_idx" ON "store_categories" USING btree ("store_id","sorting");--> statement-breakpoint
CREATE INDEX "store_categories_active_idx" ON "store_categories" USING btree ("store_id","is_active");--> statement-breakpoint
CREATE INDEX "store_items_store_id_idx" ON "store_items" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_items_category_id_idx" ON "store_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "store_items_sorting_idx" ON "store_items" USING btree ("category_id","sorting");--> statement-breakpoint
CREATE INDEX "store_items_active_idx" ON "store_items" USING btree ("store_id","is_active");--> statement-breakpoint
CREATE INDEX "store_items_out_of_stock_idx" ON "store_items" USING btree ("store_id","out_of_stock");--> statement-breakpoint
CREATE INDEX "store_item_addons_item_id_idx" ON "store_item_addons" USING btree ("store_item_id");--> statement-breakpoint
CREATE INDEX "store_item_addons_store_id_idx" ON "store_item_addons" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_item_addons_sorting_idx" ON "store_item_addons" USING btree ("store_item_id","sorting");--> statement-breakpoint
CREATE INDEX "store_cat_assign_store_idx" ON "store_category_assignments" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_cat_assign_category_idx" ON "store_category_assignments" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "store_cat_assign_sponsored_idx" ON "store_category_assignments" USING btree ("category_id","is_sponsored","sorting");--> statement-breakpoint
CREATE INDEX "store_payouts_store_idx" ON "store_payouts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_payouts_period_idx" ON "store_payouts" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "store_payouts_status_idx" ON "store_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_payouts_store_period_idx" ON "store_payouts" USING btree ("store_id","period_start");--> statement-breakpoint
CREATE INDEX "categories_city_id_idx" ON "categories" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "categories_sorting_idx" ON "categories" USING btree ("sorting");--> statement-breakpoint
CREATE INDEX "categories_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sections_city_id_idx" ON "sections" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "sections_sorting_idx" ON "sections" USING btree ("sorting");--> statement-breakpoint
CREATE INDEX "sections_active_idx" ON "sections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "banners_city_id_idx" ON "banners" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "banners_sorting_idx" ON "banners" USING btree ("sorting");--> statement-breakpoint
CREATE INDEX "banners_active_idx" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "banners_dates_idx" ON "banners" USING btree ("starts_at","expires_at");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_store_id_idx" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "orders_city_id_idx" ON "orders" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "orders_country_id_idx" ON "orders" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_store_status_idx" ON "orders" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_store_item_id_idx" ON "order_items" USING btree ("store_item_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_created_idx" ON "order_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "carts_user_id_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "carts_store_id_idx" ON "carts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "carts_user_store_idx" ON "carts" USING btree ("user_id","store_id");--> statement-breakpoint
CREATE INDEX "carts_expires_idx" ON "carts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_store_item_id_idx" ON "cart_items" USING btree ("store_item_id");--> statement-breakpoint
CREATE INDEX "payment_options_country_id_idx" ON "payment_options" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "payment_options_active_idx" ON "payment_options" USING btree ("country_id","is_active");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_transaction_id_idx" ON "payments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "payments_country_id_idx" ON "payments" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promo_codes_city_id_idx" ON "promo_codes" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "promo_codes_active_idx" ON "promo_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "promo_codes_dates_idx" ON "promo_codes" USING btree ("starts_at","expires_at");--> statement-breakpoint
CREATE INDEX "promo_usage_promo_id_idx" ON "promo_code_usage" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "promo_usage_user_id_idx" ON "promo_code_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promo_usage_order_id_idx" ON "promo_code_usage" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "promo_usage_user_promo_idx" ON "promo_code_usage" USING btree ("user_id","promo_code_id");--> statement-breakpoint
CREATE INDEX "promotions_city_id_idx" ON "promotions" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "promotions_active_idx" ON "promotions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "promotions_dates_idx" ON "promotions" USING btree ("starts_at","expires_at");--> statement-breakpoint
CREATE INDEX "promotions_main_view_idx" ON "promotions" USING btree ("has_main_view","is_active");--> statement-breakpoint
CREATE INDEX "promo_stores_promotion_idx" ON "promotion_stores" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "promo_stores_store_idx" ON "promotion_stores" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "promo_stores_sorting_idx" ON "promotion_stores" USING btree ("promotion_id","sorting");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_admin_id_idx" ON "support_tickets" USING btree ("assigned_admin_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_department_idx" ON "support_tickets" USING btree ("department");--> statement-breakpoint
CREATE INDEX "support_tickets_ticket_number_idx" ON "support_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "support_tickets_order_id_idx" ON "support_tickets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "support_tickets_country_id_idx" ON "support_tickets" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_id_idx" ON "support_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_messages_created_idx" ON "support_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_store_id_idx" ON "reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "reviews_driver_id_idx" ON "reviews" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "reviews_order_id_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reviews_type_status_idx" ON "reviews" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "reviews_store_rating_idx" ON "reviews" USING btree ("store_id","rating");--> statement-breakpoint
CREATE INDEX "reviews_country_id_idx" ON "reviews" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "stories_user_id_idx" ON "stories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stories_store_id_idx" ON "stories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "stories_city_id_idx" ON "stories" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "stories_country_id_idx" ON "stories" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "stories_expires_idx" ON "stories" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "stories_created_idx" ON "stories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "group_chats_supervisor_idx" ON "group_chats" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "group_chats_city_idx" ON "group_chats" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "group_members_group_idx" ON "group_chat_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_chat_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_members_unique_idx" ON "group_chat_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_conv_group_idx" ON "group_conversations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_conv_user_idx" ON "group_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_conv_created_idx" ON "group_conversations" USING btree ("group_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_sender_idx" ON "transactions" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "transactions_receiver_idx" ON "transactions" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "transactions_reference_idx" ON "transactions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_country_id_idx" ON "transactions" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "transactions_created_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "settings_city_idx" ON "settings" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "settings_country_idx" ON "settings" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_type","actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_table_idx" ON "audit_logs" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "audit_logs_record_idx" ON "audit_logs" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "search_index_table_idx" ON "search_index_status" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "search_index_status_idx" ON "search_index_status" USING btree ("status");