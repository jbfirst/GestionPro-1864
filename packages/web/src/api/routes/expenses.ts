import { ORPCError } from "@orpc/server";
import { and, desc, eq, gte, like, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import * as schema from "../database/schema.js";
import { business } from "../middleware/auth.js";

export const expenseCategories = [
  "Loyer",
  "Électricité",
  "Transport",
  "Internet",
  "Achat matériel",
  "Salaires",
  "Autres",
] as const;

const expenseInput = z.object({
  description: z.string().trim().min(2, "La description est trop courte.").max(200),
  category: z.string().trim().min(2, "Choisissez une catégorie.").max(60),
  amount: z.number().gt(0, "Le montant doit être supérieur à 0."),
  spentAt: z.string().optional(),
});

async function assertOwned(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.expenses)
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.businessId, businessId)))
    .limit(1);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Dépense introuvable." });
  return row;
}

export const expenses = {
  categories: business.handler(() => [...expenseCategories]),

  list: business
    .input(
      z
        .object({
          search: z.string().trim().max(120).optional(),
          category: z.string().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .optional(),
    )
    .handler(({ input, context }) => {
      const filters = [eq(schema.expenses.businessId, context.businessId)];
      if (input?.category) filters.push(eq(schema.expenses.category, input.category));
      if (input?.from) filters.push(gte(schema.expenses.spentAt, new Date(`${input.from}T00:00:00`)));
      if (input?.to) {
        const to = new Date(`${input.to}T00:00:00`);
        to.setDate(to.getDate() + 1);
        filters.push(lt(schema.expenses.spentAt, to));
      }
      if (input?.search) {
        const term = `%${input.search.toLowerCase()}%`;
        filters.push(
          or(
            like(sql`lower(${schema.expenses.description})`, term),
            like(sql`lower(${schema.expenses.category})`, term),
          )!,
        );
      }

      return db
        .select()
        .from(schema.expenses)
        .where(and(...filters))
        .orderBy(desc(schema.expenses.spentAt))
        .limit(200);
    }),

  create: business.input(expenseInput).handler(async ({ input, context }) => {
    const [row] = await db
      .insert(schema.expenses)
      .values({
        businessId: context.businessId,
        description: input.description,
        category: input.category,
        amount: input.amount,
        spentAt: input.spentAt ? new Date(`${input.spentAt}T12:00:00`) : new Date(),
      })
      .returning();
    return row;
  }),

  update: business
    .input(expenseInput.extend({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const current = await assertOwned(context.businessId, input.id);
      const [row] = await db
        .update(schema.expenses)
        .set({
          description: input.description,
          category: input.category,
          amount: input.amount,
          spentAt: input.spentAt ? new Date(`${input.spentAt}T12:00:00`) : current.spentAt,
        })
        .where(
          and(
            eq(schema.expenses.id, input.id),
            eq(schema.expenses.businessId, context.businessId),
          ),
        )
        .returning();
      return row;
    }),

  remove: business.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await assertOwned(context.businessId, input.id);
    await db
      .delete(schema.expenses)
      .where(
        and(eq(schema.expenses.id, input.id), eq(schema.expenses.businessId, context.businessId)),
      );
    return { id: input.id };
  }),
};
