import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app.js";
import { auth } from "./auth.js";
import { account } from "./routes/account.js";
import { categories } from "./routes/categories.js";
import { customers } from "./routes/customers.js";
import { dashboard } from "./routes/dashboard.js";
import { expenses } from "./routes/expenses.js";
import { ping } from "./routes/ping.js";
import { products } from "./routes/products.js";
import { reports } from "./routes/reports.js";
import { sales } from "./routes/sales.js";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
export const router = {
  ping,
  account,
  categories,
  products,
  customers,
  sales,
  expenses,
  dashboard,
  reports,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default app;
