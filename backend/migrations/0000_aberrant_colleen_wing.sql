CREATE TABLE IF NOT EXISTS "email_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"sync_token" varchar(32) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"confirmation_code" text,
	"confirmation_raw_text" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_connections_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "email_connections_sync_token_unique" UNIQUE("sync_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" real NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"note" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" varchar(20),
	"next_date" timestamp,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" real NOT NULL,
	"source" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'Other',
	"note" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" real DEFAULT 0,
	"date" timestamp NOT NULL,
	"time" varchar(10) DEFAULT '09:00',
	"category" varchar(50) DEFAULT 'Other',
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" varchar(20),
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saving_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"target_amount" real NOT NULL,
	"current_amount" real DEFAULT 0,
	"deadline" timestamp,
	"icon" varchar(10) DEFAULT '🎯',
	"color" varchar(20) DEFAULT '#00ff88',
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "savings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" real NOT NULL,
	"note" text DEFAULT 'Savings',
	"date" timestamp DEFAULT now() NOT NULL,
	"goal_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "synced_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" varchar(998) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" varchar(10) NOT NULL,
	"amount" real,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "synced_emails_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"image_url" text,
	"settings" jsonb DEFAULT '{"monthlyBudget":25000,"currency":"₹","categoryBudgets":{"Food":6000,"Transport":3000,"Shopping":4000,"Entertainment":2000,"Bills":5000,"Health":2000,"Other":3000},"notifications":{"email":true,"push":true,"budgetAlerts":true}}'::jsonb,
	"gamification" jsonb DEFAULT '{"totalPoints":0,"level":1,"currentStreak":0,"longestStreak":0,"lastActivityDate":null,"badges":[],"achievements":[]}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
