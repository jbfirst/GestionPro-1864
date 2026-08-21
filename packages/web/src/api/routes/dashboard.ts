import { and, count, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import * as schema from "../database/schema.js";
import { business } from "../middleware/auth.js";
import { dayKey, dayKeys, periodRange, periodSchema } from "../lib/period.js";

function num(value: unknown) {
  return Number(value ?? 0);
}

export const dashboard = {
  summary: business
    .input(z.object({ period: periodSchema.default("30d") }).optional())
    .handler(async ({ input, context }) => {
      const period = input?.period ?? "30d";
      const { from, to } = periodRange(period);
      const businessId = context.businessId;
      const today = periodRange("today");

      const [salesAgg] = await db
        .select({
          revenue: sql<number>`coalesce(${sum(schema.sales.total)}, 0)`,
          profit: sql<number>`coalesce(${sum(schema.sales.profit)}, 0)`,
          salesCount: count(schema.sales.id),
        })
        .from(schema.sales)
        .where(
          and(
            eq(schema.sales.businessId, businessId),
            gte(schema.sales.soldAt, from),
            lt(schema.sales.soldAt, to),
          ),
        );

      const [todayAgg] = await db
        .select({
          revenue: sql<number>`coalesce(${sum(schema.sales.total)}, 0)`,
          salesCount: count(schema.sales.id),
        })
        .from(schema.sales)
        .where(
          and(
            eq(schema.sales.businessId, businessId),
            gte(schema.sales.soldAt, today.from),
            lt(schema.sales.soldAt, today.to),
          ),
        );

      const [expenseAgg] = await db
        .select({ total: sql<number>`coalesce(${sum(schema.expenses.amount)}, 0)` })
        .from(schema.expenses)
        .where(
          and(
            eq(schema.expenses.businessId, businessId),
            gte(schema.expenses.spentAt, from),
            lt(schema.expenses.spentAt, to),
          ),
        );

      const [productAgg] = await db
        .select({
          total: count(schema.products.id),
          stockValue: sql<number>`coalesce(sum(${schema.products.stock} * ${schema.products.purchasePrice}), 0)`,
        })
        .from(schema.products)
        .where(eq(schema.products.businessId, businessId));

      const [customerAgg] = await db
        .select({ total: count(schema.customers.id) })
        .from(schema.customers)
        .where(eq(schema.customers.businessId, businessId));

      const lowStock = await db
        .select({
          id: schema.products.id,
          name: schema.products.name,
          stock: schema.products.stock,
          minStock: schema.products.minStock,
        })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.businessId, businessId),
            lte(schema.products.stock, schema.products.minStock),
          ),
        )
        .orderBy(schema.products.stock)
        .limit(8);

      const recentSales = await db
        .select({
          id: schema.sales.id,
          reference: schema.sales.reference,
          total: schema.sales.total,
          soldAt: schema.sales.soldAt,
          customerName: schema.customers.name,
          summary: sql<
            string | null
          >`(select group_concat(${schema.saleItems.productName}, ', ') from ${schema.saleItems} where ${schema.saleItems.saleId} = ${schema.sales.id})`,
          quantity: sql<number>`(select coalesce(sum(${schema.saleItems.quantity}), 0) from ${schema.saleItems} where ${schema.saleItems.saleId} = ${schema.sales.id})`,
        })
        .from(schema.sales)
        .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
        .where(eq(schema.sales.businessId, businessId))
        .orderBy(desc(schema.sales.soldAt))
        .limit(6);

      const chartFrom = period === "all" ? periodRange("30d").from : from;
      const revenueRows = await db
        .select({
          day: sql<string>`strftime('%Y-%m-%d', ${schema.sales.soldAt} / 1000, 'unixepoch')`,
          revenue: sql<number>`coalesce(${sum(schema.sales.total)}, 0)`,
          profit: sql<number>`coalesce(${sum(schema.sales.profit)}, 0)`,
        })
        .from(schema.sales)
        .where(
          and(
            eq(schema.sales.businessId, businessId),
            gte(schema.sales.soldAt, chartFrom),
            lt(schema.sales.soldAt, to),
          ),
        )
        .groupBy(sql`1`);

      const byDay = new Map(revenueRows.map((r) => [r.day, r]));
      const series = dayKeys(chartFrom, to).map((day) => ({
        day,
        revenue: num(byDay.get(day)?.revenue),
        profit: num(byDay.get(day)?.profit),
      }));

      const revenue = num(salesAgg?.revenue);
      const grossProfit = num(salesAgg?.profit);
      const expensesTotal = num(expenseAgg?.total);

      return {
        period,
        stats: {
          revenue,
          grossProfit,
          netProfit: grossProfit - expensesTotal,
          salesCount: num(salesAgg?.salesCount),
          productsCount: num(productAgg?.total),
          customersCount: num(customerAgg?.total),
          expensesTotal,
          stockValue: num(productAgg?.stockValue),
          todayRevenue: num(todayAgg?.revenue),
          todaySalesCount: num(todayAgg?.salesCount),
        },
        lowStock,
        recentSales,
        series,
        todayKey: dayKey(new Date()),
      };
    }),
};
