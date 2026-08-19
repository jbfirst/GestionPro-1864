import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { auth } from "../auth";
import { db } from "../database";
import * as schema from "../database/schema";

/** Auth optionnelle — `context.user` vaut l'utilisateur de session ou null. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: { user: session?.user ?? null, session: session?.session ?? null },
  });
});

/** Procédures protégées — rejette les appels non authentifiés. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Session expirée. Reconnectez-vous." });
  return next({ context: { user: session.user, session: session.session } });
});

/**
 * Procédures liées à une entreprise. L'identifiant d'entreprise est TOUJOURS résolu
 * depuis la session — jamais accepté depuis le client. C'est l'équivalent applicatif
 * des politiques RLS : aucune requête ne peut atteindre les données d'une autre entreprise.
 */
export const business = authed.use(async ({ context, next }) => {
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, context.user.id))
    .limit(1);

  if (!profile) {
    throw new ORPCError("FORBIDDEN", {
      message: "Aucune entreprise associée à ce compte.",
      data: { code: "NO_BUSINESS" },
    });
  }

  return next({ context: { profile, businessId: profile.businessId } });
});
