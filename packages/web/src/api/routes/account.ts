import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as schema from "../database/schema";
import { authed, business } from "../middleware/auth";

const defaultCategories = [
  "Alimentation",
  "Boissons",
  "Hygiène",
  "Électronique",
  "Vêtements",
  "Autres",
];

export const account = {
  /** Session + entreprise courante (null si l'utilisateur n'a pas encore d'entreprise). */
  me: authed.handler(async ({ context }) => {
    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, context.user.id))
      .limit(1);

    if (!profile) {
      return {
        user: { id: context.user.id, name: context.user.name, email: context.user.email },
        profile: null,
        business: null,
      };
    }

    const [biz] = await db
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, profile.businessId))
      .limit(1);

    return {
      user: { id: context.user.id, name: context.user.name, email: context.user.email },
      profile,
      business: biz ?? null,
    };
  }),

  /** Crée l'entreprise de l'utilisateur (inscription ou première connexion Google). */
  setupBusiness: authed
    .input(
      z.object({
        businessName: z.string().trim().min(2, "Le nom de l'entreprise est trop court."),
        fullName: z.string().trim().min(2, "Le nom complet est trop court.").optional(),
        phone: z.string().trim().max(30).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [existing] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, context.user.id))
        .limit(1);

      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "Une entreprise est déjà associée à ce compte.",
        });
      }

      const [biz] = await db
        .insert(schema.businesses)
        .values({
          name: input.businessName,
          phone: input.phone ?? null,
          ownerId: context.user.id,
        })
        .returning();

      const [profile] = await db
        .insert(schema.profiles)
        .values({
          userId: context.user.id,
          businessId: biz.id,
          fullName: input.fullName ?? context.user.name ?? context.user.email,
          phone: input.phone ?? null,
          role: "owner",
        })
        .returning();

      await db.insert(schema.categories).values(
        defaultCategories.map((name) => ({ businessId: biz.id, name })),
      );

      return { business: biz, profile };
    }),

  updateBusiness: business
    .input(
      z.object({
        name: z.string().trim().min(2, "Le nom de l'entreprise est trop court."),
        phone: z.string().trim().max(30).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [biz] = await db
        .update(schema.businesses)
        .set({ name: input.name, phone: input.phone ?? null })
        .where(eq(schema.businesses.id, context.businessId))
        .returning();
      return biz;
    }),

  updateProfile: business
    .input(
      z.object({
        fullName: z.string().trim().min(2, "Le nom complet est trop court."),
        phone: z.string().trim().max(30).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [profile] = await db
        .update(schema.profiles)
        .set({ fullName: input.fullName, phone: input.phone ?? null })
        .where(eq(schema.profiles.id, context.profile.id))
        .returning();
      return profile;
    }),
};
