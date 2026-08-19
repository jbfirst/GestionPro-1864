import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, inArray, like, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as schema from "../database/schema";
import { business } from "../middleware/auth";

const itemInput = z.object({
  productId: z.string(),
  quantity: z.number().gt(0, "La quantité doit être supérieure à 0."),
  unitPrice: z.number().gt(0, "Le prix unitaire doit être supérieur à 0.").optional(),
});

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export const sales = {
  list: business
    .input(
      z
        .object({
          search: z.string().trim().max(120).optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          customerId: z.string().optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional(),
    )
    .handler(async ({ input, context }) => {
      const filters = [eq(schema.sales.businessId, context.businessId)];
      if (input?.from) filters.push(gte(schema.sales.soldAt, new Date(`${input.from}T00:00:00`)));
      if (input?.to) {
        const to = new Date(`${input.to}T00:00:00`);
        to.setDate(to.getDate() + 1);
        filters.push(lt(schema.sales.soldAt, to));
      }
      if (input?.customerId) filters.push(eq(schema.sales.customerId, input.customerId));
      if (input?.search) {
        const term = `%${input.search.toLowerCase()}%`;
        filters.push(
          or(
            like(sql`lower(${schema.sales.reference})`, term),
            like(sql`lower(coalesce(${schema.customers.name}, ''))`, term),
            like(
              sql`lower(coalesce((select group_concat(${schema.saleItems.productName}) from ${schema.saleItems} where ${schema.saleItems.saleId} = ${schema.sales.id}), ''))`,
              term,
            ),
          )!,
        );
      }

      const rows = await db
        .select({
          id: schema.sales.id,
          reference: schema.sales.reference,
          total: schema.sales.total,
          profit: schema.sales.profit,
          note: schema.sales.note,
          soldAt: schema.sales.soldAt,
          customerId: schema.sales.customerId,
          customerName: schema.customers.name,
          itemCount: sql<number>`(select coalesce(sum(${schema.saleItems.quantity}), 0) from ${schema.saleItems} where ${schema.saleItems.saleId} = ${schema.sales.id})`,
          summary: sql<
            string | null
          >`(select group_concat(${schema.saleItems.productName}, ', ') from ${schema.saleItems} where ${schema.saleItems.saleId} = ${schema.sales.id})`,
        })
        .from(schema.sales)
        .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
        .where(and(...filters))
        .orderBy(desc(schema.sales.soldAt))
        .limit(input?.limit ?? 100);

      return rows;
    }),

  get: business.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [sale] = await db
      .select({
        id: schema.sales.id,
        reference: schema.sales.reference,
        total: schema.sales.total,
        profit: schema.sales.profit,
        note: schema.sales.note,
        soldAt: schema.sales.soldAt,
        customerId: schema.sales.customerId,
        customerName: schema.customers.name,
      })
      .from(schema.sales)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
      .where(
        and(eq(schema.sales.id, input.id), eq(schema.sales.businessId, context.businessId)),
      )
      .limit(1);

    if (!sale) throw new ORPCError("NOT_FOUND", { message: "Vente introuvable." });

    const items = await db
      .select()
      .from(schema.saleItems)
      .where(eq(schema.saleItems.saleId, sale.id));

    return { ...sale, items };
  }),

  create: business
    .input(
      z.object({
        items: z.array(itemInput).min(1, "Ajoutez au moins un produit."),
        customerId: z.string().nullish(),
        note: z.string().trim().max(300).optional(),
        soldAt: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const productIds = [...new Set(input.items.map((i) => i.productId))];
      const rows = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.businessId, context.businessId),
            inArray(schema.products.id, productIds),
          ),
        );

      const byId = new Map(rows.map((p) => [p.id, p]));
      if (byId.size !== productIds.length) {
        throw new ORPCError("BAD_REQUEST", { message: "Un des produits est introuvable." });
      }

      if (input.customerId) {
        const [customer] = await db
          .select({ id: schema.customers.id })
          .from(schema.customers)
          .where(
            and(
              eq(schema.customers.id, input.customerId),
              eq(schema.customers.businessId, context.businessId),
            ),
          )
          .limit(1);
        if (!customer) throw new ORPCError("BAD_REQUEST", { message: "Client invalide." });
      }

      // Regroupe les lignes portant sur le même produit avant de vérifier le stock.
      const merged = new Map<string, { quantity: number; unitPrice?: number }>();
      for (const item of input.items) {
        const current = merged.get(item.productId);
        merged.set(item.productId, {
          quantity: (current?.quantity ?? 0) + item.quantity,
          unitPrice: item.unitPrice ?? current?.unitPrice,
        });
      }

      for (const [productId, line] of merged) {
        const product = byId.get(productId)!;
        if (line.quantity > product.stock) {
          throw new ORPCError("BAD_REQUEST", {
            message: `Stock insuffisant pour « ${product.name} » : ${product.stock} en stock.`,
          });
        }
      }

      const [{ value: existing }] = await db
        .select({ value: count() })
        .from(schema.sales)
        .where(eq(schema.sales.businessId, context.businessId));

      const reference = `V-${String(Number(existing) + 1).padStart(5, "0")}`;
      const soldAt = input.soldAt ? new Date(`${input.soldAt}T12:00:00`) : new Date();

      const lines = [...merged.entries()].map(([productId, line]) => {
        const product = byId.get(productId)!;
        const unitPrice = line.unitPrice ?? product.salePrice;
        const total = round2(unitPrice * line.quantity);
        const profit = round2((unitPrice - product.purchasePrice) * line.quantity);
        return {
          businessId: context.businessId,
          productId,
          productName: product.name,
          quantity: line.quantity,
          unitPrice,
          unitCost: product.purchasePrice,
          total,
          profit,
          newStock: round2(product.stock - line.quantity),
        };
      });

      const total = round2(lines.reduce((sum, l) => sum + l.total, 0));
      const profit = round2(lines.reduce((sum, l) => sum + l.profit, 0));

      const [sale] = await db
        .insert(schema.sales)
        .values({
          businessId: context.businessId,
          customerId: input.customerId ?? null,
          reference,
          total,
          profit,
          note: input.note ?? null,
          soldAt,
        })
        .returning();

      await db.batch([
        db.insert(schema.saleItems).values(
          lines.map(({ newStock: _newStock, ...line }) => ({ ...line, saleId: sale.id })),
        ),
        ...lines.map((line) =>
          db
            .update(schema.products)
            .set({ stock: line.newStock })
            .where(
              and(
                eq(schema.products.id, line.productId),
                eq(schema.products.businessId, context.businessId),
              ),
            ),
        ),
      ] as unknown as Parameters<typeof db.batch>[0]);

      return { ...sale, itemCount: lines.length };
    }),

  /** Annule une vente et remet les quantités en stock. */
  remove: business.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [sale] = await db
      .select()
      .from(schema.sales)
      .where(and(eq(schema.sales.id, input.id), eq(schema.sales.businessId, context.businessId)))
      .limit(1);
    if (!sale) throw new ORPCError("NOT_FOUND", { message: "Vente introuvable." });

    const items = await db
      .select()
      .from(schema.saleItems)
      .where(eq(schema.saleItems.saleId, sale.id));

    const restocks = items
      .filter((item) => item.productId)
      .map((item) =>
        db
          .update(schema.products)
          .set({ stock: sql`${schema.products.stock} + ${item.quantity}` })
          .where(
            and(
              eq(schema.products.id, item.productId!),
              eq(schema.products.businessId, context.businessId),
            ),
          ),
      );

    await db.batch([
      ...restocks,
      db.delete(schema.saleItems).where(eq(schema.saleItems.saleId, sale.id)),
      db.delete(schema.sales).where(eq(schema.sales.id, sale.id)),
    ] as unknown as Parameters<typeof db.batch>[0]);

    return { id: sale.id };
  }),
};
