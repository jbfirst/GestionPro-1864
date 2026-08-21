export const config = { runtime: "nodejs" };

import { handle } from "@hono/node-server/vercel";
import app from "../src/api/index.js";

export default handle(app);