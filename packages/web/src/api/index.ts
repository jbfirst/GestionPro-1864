import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { account } from "./routes/account";
import { categories } from "./routes/categories";
import { customers } from "./routes/customers";
import { dashboard } from "./routes/dashboard";
import { expenses } from "./routes/expenses";
import { ping } from "./routes/ping";
import { products } from "./routes/products";
import { reports } from "./routes/reports";
import { sales } from "./routes/sales";

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
