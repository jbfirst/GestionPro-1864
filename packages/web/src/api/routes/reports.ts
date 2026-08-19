import { and, count, eq, gte, lt, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as schema from "../database/schema";
import { dayKeys, periodLabels, periodRange, periodSchema } from "../lib/period";
import { business } from "../middleware/auth";

function num(value: unknown) {
  return Number(value ?? 0);
}

export const reports = {
  overview: business
    .input(z.object({ period: periodSchema.default("30d") }).optional())
    .handler(async ({ input, context }) => {
      const period = input?.period ?? "30d";
      const { from, to } = periodRange(period);
      const businessId = context.businessId;

      const [salesAgg] = await db
        .select({
          revenue: sql<number>`coalesce(${sum(schema.sales.total)}, 0)`,
          grossProfit: sql<number>`coalesce(${sum(schema.sales.profit)}, 0)`,
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

      const salesByDay = await db
        .select({
          day: sql<string>`strftime('%Y-%m-%d', ${schema.sales.soldAt} / 1000, 'unixepoch')`,
          revenue: sql<number>`coalesce(${sum(schema.sales.total)}, 0)`,
          profit: sql<number>`coalesce(${sum(schema.sales.profit)}, 0)`,
        })
        .from(schema.sales)
        .where(
          and(
            eq(schema.sales.businessId, businessId),
            gte(schema.sales.soldAt, from),
            lt(schema.sales.soldAt, to),
          ),
        )
        .groupBy(sql`1`);

      const expensesByDay = await db
        .select({
          day: sql<string>`strftime('%Y-%m-%d', ${schema.expenses.spentAt} / 1000, 'unixepoch')`,
          amount: sql<number>`coalesce(${sum(schema.expenses.amount)}, 0)`,
        })
        .from(schema.expenses)
        .where(
          and(
            eq(schema.expenses.businessId, businessId),
            gte(schema.expenses.spentAt, from),
            lt(schema.expenses.spentAt, to),
          ),
        )
        .groupBy(sql`1`);

      const expensesByCategory = await db
        .select({
          category: schema.expenses.category,
          amount: sql<number>`coalesce(${sum(schema.expenses.amount)}, 0)`,
        })
        .from(schema.expenses)
        .where(
          and(
            eq(schema.expenses.businessId, businessId),
            gte(schema.expenses.spentAt, from),
            lt(schema.expenses.spentAt, to),
          ),
        )
        .groupBy(schema.expenses.category);

      const topProducts = await db
        .select({
          name: schema.saleItems.productName,
          quantity: sql<number>`coalesce(${sum(schema.saleItems.quantity)}, 0)`,
          revenue: sql<number>`coalesce(${sum(schema.saleItems.total)}, 0)`,
          profit: sql<number>`coalesce(${sum(schema.saleItems.profit)}, 0)`,
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.sales.id, schema.saleItems.saleId))
        .where(
          and(
            eq(schema.saleItems.businessId, businessId),
            gte(schema.sales.soldAt, from),
            lt(schema.sales.soldAt, to),
          ),
        )
        .groupBy(schema.saleItems.productName)
        .orderBy(sql`3 desc`)
        .limit(8);

      const revenueMap = new Map(salesByDay.map((r) => [r.day, r]));
      const expenseMap = new Map(expensesByDay.map((r) => [r.day, r]));
      const chartFrom = period === "all" ? periodRange("30d").from : from;
      const series = dayKeys(chartFrom, to).map((day) => ({
        day,
        revenue: num(revenueMap.get(day)?.revenue),
        profit: num(revenueMap.get(day)?.profit),
        expenses: num(expenseMap.get(day)?.amount),
      }));

      const revenue = num(salesAgg?.revenue);
      const grossProfit = num(salesAgg?.grossProfit);
      const expensesTotal = num(expenseAgg?.total);
      const salesCount = num(salesAgg?.salesCount);

      return {
        period,
        label: periodLabels[period],
        from,
        to,
        totals: {
          revenue,
          expenses: expensesTotal,
          grossProfit,
          netProfit: grossProfit - expensesTotal,
          salesCount,
          averageBasket: salesCount ? revenue / salesCount : 0,
        },
        series,
        expensesByCategory: expensesByCategory.map((r) => ({
          category: r.category,
          amount: num(r.amount),
        })),
        topProducts: topProducts.map((r) => ({
          name: r.name,
          quantity: num(r.quantity),
          revenue: num(r.revenue),
          profit: num(r.profit),
        })),
      };
    }),
};
