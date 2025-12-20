import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/**
 * OAuth Providers Enum
 */
export const oauthProviders = ["google", "apple", "facebook"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

/**
 * User OAuth Accounts Table
 * Links users to their OAuth provider accounts
 */
export const userOAuthAccounts = pgTable("user_oauth_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    provider: varchar("provider", { length: 20 }).notNull().$type<OAuthProvider>(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),

    // Optional: store tokens if needed for API calls
    accessToken: varchar("access_token", { length: 500 }),
    refreshToken: varchar("refresh_token", { length: 500 }),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("user_oauth_provider_idx").on(table.provider, table.providerAccountId),
    index("user_oauth_user_id_idx").on(table.userId),
]);

// Relations
export const userOAuthAccountsRelations = relations(userOAuthAccounts, ({ one }) => ({
    user: one(users, {
        fields: [userOAuthAccounts.userId],
        references: [users.id],
    }),
}));

export type UserOAuthAccount = typeof userOAuthAccounts.$inferSelect;
export type NewUserOAuthAccount = typeof userOAuthAccounts.$inferInsert;
