import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, like, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import * as schema from "../database/schema.js";
import { business } from "../middleware/auth.js";

const productInput = z.object({
  name: z.string().trim().min(2, "Le nom du produit est trop court.").max(120),
  description: z.string().trim().max(500).optional(),
  categoryId: z.string().nullish(),
  purchasePrice: z.number().min(0, "Le prix d'achat doit être positif."),
  salePrice: z.number().gt(0, "Le prix de vente doit être supérieur à 0."),
  stock: z.number().min(0, "La quantité en stock doit être positive ou nulle."),
  minStock: z.number().min(0, "Le stock minimum doit être positif ou nul."),
});

async function assertOwned(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.id, id), eq(schema.products.businessId, businessId)))
    .limit(1);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Produit introuvable." });
  return row;
}

async function assertCategory(businessId: string, categoryId?: string | null) {
  if (!categoryId) return null;
  const [row] = await db
    .select()
    .from(schema.categories)
    .where(
      and(eq(schema.categories.id, categoryId), eq(schema.categories.businessId, businessId)),
    )
    .limit(1);
  if (!row) throw new ORPCError("BAD_REQUEST", { message: "Catégorie invalide." });
  return row.id;
}

const listSelection = {
  id: schema.products.id,
  name: schema.products.name,
  description: schema.products.description,
  categoryId: schema.products.categoryId,
  categoryName: schema.categories.name,
  purchasePrice: schema.products.purchasePrice,
  salePrice: schema.products.salePrice,
  stock: schema.products.stock,
  minStock: schema.products.minStock,
  createdAt: schema.products.createdAt,
};

export const products = {
  list: business
    .input(
      z
        .object({
          search: z.string().trim().max(120).optional(),
          categoryId: z.string().optional(),
          lowStockOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .handler(async ({ input, context }) => {
      const filters = [eq(schema.products.businessId, context.businessId)];
      if (input?.search) {
        const term = `%${input.search.toLowerCase()}%`;
        filters.push(
          or(
            like(sql`lower(${schema.products.name})`, term),
            like(sql`lower(coalesce(${schema.products.description}, ''))`, term),
          )!,
        );
      }
      if (input?.categoryId) filters.push(eq(schema.products.categoryId, input.categoryId));
      if (input?.lowStockOnly) filters.push(lte(schema.products.stock, schema.products.minStock));

      return db
        .select(listSelection)
        .from(schema.products)
        .leftJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
        .where(and(...filters))
        .orderBy(asc(schema.products.name));
    }),

  /** Produits sous le seuil de stock minimum. */
  lowStock: business.handler(({ context }) =>
    db
      .select(listSelection)
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
      .where(
        and(
          eq(schema.products.businessId, context.businessId),
          lte(schema.products.stock, schema.products.minStock),
        ),
      )
      .orderBy(asc(schema.products.stock))
      .limit(20),
  ),

  get: business.input(z.object({ id: z.string() })).handler(({ input, context }) =>
    assertOwned(context.businessId, input.id),
  ),

  create: business.input(productInput).handler(async ({ input, context }) => {
    const categoryId = await assertCategory(context.businessId, input.categoryId);
    const [row] = await db
      .insert(schema.products)
      .values({
        businessId: context.businessId,
        name: input.name,
        description: input.description ?? null,
        categoryId,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        stock: input.stock,
        minStock: input.minStock,
      })
      .returning();
    return row;
  }),

  update: business
    .input(productInput.extend({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await assertOwned(context.businessId, input.id);
      const categoryId = await assertCategory(context.businessId, input.categoryId);
      const [row] = await db
        .update(schema.products)
        .set({
          name: input.name,
          description: input.description ?? null,
          categoryId,
          purchasePrice: input.purchasePrice,
          salePrice: input.salePrice,
          stock: input.stock,
          minStock: input.minStock,
        })
        .where(
          and(
            eq(schema.products.id, input.id),
            eq(schema.products.businessId, context.businessId),
          ),
        )
        .returning();
      return row;
    }),

  /** Réapprovisionnement rapide : ajoute une quantité au stock existant. */
  restock: business
    .input(z.object({ id: z.string(), quantity: z.number().gt(0, "La quantité doit être supérieure à 0.") }))
    .handler(async ({ input, context }) => {
      const product = await assertOwned(context.businessId, input.id);
      const [row] = await db
        .update(schema.products)
        .set({ stock: product.stock + input.quantity })
        .where(eq(schema.products.id, product.id))
        .returning();
      return row;
    }),

  remove: business.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await assertOwned(context.businessId, input.id);
    await db
      .delete(schema.products)
      .where(
        and(eq(schema.products.id, input.id), eq(schema.products.businessId, context.businessId)),
      );
    return { id: input.id };
  }),

  /** Derniers produits créés — utilisé sur mobile. */
  recent: business.handler(({ context }) =>
    db
      .select(listSelection)
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
      .where(eq(schema.products.businessId, context.businessId))
      .orderBy(desc(schema.products.createdAt))
      .limit(10),
  ),
};
