import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema.js";

export * from "./auth-schema.js";
const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

/** Une entreprise = un espace de données isolé. */
export const businesses = sqliteTable("businesses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone"),
  currency: text("currency").notNull().default("FCFA"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at"),
});

/** Profil applicatif : rattache un utilisateur auth à une entreprise + son rôle. */
export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    role: text("role", { enum: ["owner", "staff"] })
      .notNull()
      .default("owner"),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("profiles_business_idx").on(t.businessId)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("categories_business_idx").on(t.businessId)],
);

export const products = sqliteTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    purchasePrice: real("purchase_price").notNull().default(0),
    salePrice: real("sale_price").notNull().default(0),
    stock: real("stock").notNull().default(0),
    minStock: real("min_stock").notNull().default(0),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("products_business_idx").on(t.businessId)],
);

export const customers = sqliteTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("customers_business_idx").on(t.businessId)],
);

export const sales = sqliteTable(
  "sales",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    reference: text("reference").notNull(),
    total: real("total").notNull().default(0),
    profit: real("profit").notNull().default(0),
    note: text("note"),
    soldAt: integer("sold_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    index("sales_business_idx").on(t.businessId),
    index("sales_sold_at_idx").on(t.soldAt),
  ],
);

export const saleItems = sqliteTable(
  "sale_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    quantity: real("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    unitCost: real("unit_cost").notNull().default(0),
    total: real("total").notNull(),
    profit: real("profit").notNull().default(0),
  },
  (t) => [
    index("sale_items_sale_idx").on(t.saleId),
    index("sale_items_business_idx").on(t.businessId),
  ],
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    category: text("category").notNull().default("Autres"),
    amount: real("amount").notNull(),
    spentAt: integer("spent_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: timestamp("created_at"),
  },
  (t) => [
    index("expenses_business_idx").on(t.businessId),
    index("expenses_spent_at_idx").on(t.spentAt),
  ],
);

export const nowSql = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;
