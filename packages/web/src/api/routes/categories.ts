import { ORPCError } from "@orpc/server";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as schema from "../database/schema";
import { business } from "../middleware/auth";

const nameSchema = z.string().trim().min(2, "Le nom de la catégorie est trop court.").max(60);

async function assertOwned(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.businessId, businessId)))
    .limit(1);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Catégorie introuvable." });
  return row;
}

export const categories = {
  list: business.handler(async ({ context }) => {
    const rows = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        createdAt: schema.categories.createdAt,
        productCount: count(schema.products.id),
      })
      .from(schema.categories)
      .leftJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
      .where(eq(schema.categories.businessId, context.businessId))
      .groupBy(schema.categories.id)
      .orderBy(asc(schema.categories.name));
    return rows;
  }),

  create: business
    .input(z.object({ name: nameSchema }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(schema.categories)
        .values({ businessId: context.businessId, name: input.name })
        .returning();
      return row;
    }),

  update: business
    .input(z.object({ id: z.string(), name: nameSchema }))
    .handler(async ({ input, context }) => {
      await assertOwned(context.businessId, input.id);
      const [row] = await db
        .update(schema.categories)
        .set({ name: input.name })
        .where(
          and(
            eq(schema.categories.id, input.id),
            eq(schema.categories.businessId, context.businessId),
          ),
        )
        .returning();
      return row;
    }),

  remove: business
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await assertOwned(context.businessId, input.id);
      await db
        .delete(schema.categories)
        .where(
          and(
            eq(schema.categories.id, input.id),
            eq(schema.categories.businessId, context.businessId),
          ),
        );
      return { id: input.id };
    }),
};
