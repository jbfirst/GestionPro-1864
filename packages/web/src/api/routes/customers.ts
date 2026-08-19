import { ORPCError } from "@orpc/server";
import { and, asc, count, eq, like, or, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as schema from "../database/schema";
import { business } from "../middleware/auth";

const customerInput = z.object({
  name: z.string().trim().min(2, "Le nom du client est trop court.").max(120),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.string().trim().email("Adresse email invalide."), z.literal("")]).optional(),
  address: z.string().trim().max(200).optional(),
});

async function assertOwned(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.customers)
    .where(and(eq(schema.customers.id, id), eq(schema.customers.businessId, businessId)))
    .limit(1);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Client introuvable." });
  return row;
}

export const customers = {
  list: business
    .input(z.object({ search: z.string().trim().max(120).optional() }).optional())
    .handler(async ({ input, context }) => {
      const filters = [eq(schema.customers.businessId, context.businessId)];
      if (input?.search) {
        const term = `%${input.search.toLowerCase()}%`;
        filters.push(
          or(
            like(sql`lower(${schema.customers.name})`, term),
            like(sql`lower(coalesce(${schema.customers.phone}, ''))`, term),
            like(sql`lower(coalesce(${schema.customers.email}, ''))`, term),
          )!,
        );
      }

      return db
        .select({
          id: schema.customers.id,
          name: schema.customers.name,
          phone: schema.customers.phone,
          email: schema.customers.email,
          address: schema.customers.address,
          createdAt: schema.customers.createdAt,
          purchaseCount: count(schema.sales.id),
          totalSpent: sql<number>`coalesce(${sum(schema.sales.total)}, 0)`,
        })
        .from(schema.customers)
        .leftJoin(schema.sales, eq(schema.sales.customerId, schema.customers.id))
        .where(and(...filters))
        .groupBy(schema.customers.id)
        .orderBy(asc(schema.customers.name));
    }),

  /** Liste légère pour les sélecteurs (formulaire de vente). */
  options: business.handler(({ context }) =>
    db
      .select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone })
      .from(schema.customers)
      .where(eq(schema.customers.businessId, context.businessId))
      .orderBy(asc(schema.customers.name)),
  ),

  create: business.input(customerInput).handler(async ({ input, context }) => {
    const [row] = await db
      .insert(schema.customers)
      .values({
        businessId: context.businessId,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ? input.email : null,
        address: input.address ?? null,
      })
      .returning();
    return row;
  }),

  update: business
    .input(customerInput.extend({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await assertOwned(context.businessId, input.id);
      const [row] = await db
        .update(schema.customers)
        .set({
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ? input.email : null,
          address: input.address ?? null,
        })
        .where(
          and(
            eq(schema.customers.id, input.id),
            eq(schema.customers.businessId, context.businessId),
          ),
        )
        .returning();
      return row;
    }),

  remove: business.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await assertOwned(context.businessId, input.id);
    await db
      .delete(schema.customers)
      .where(
        and(
          eq(schema.customers.id, input.id),
          eq(schema.customers.businessId, context.businessId),
        ),
      );
    return { id: input.id };
  }),
};
