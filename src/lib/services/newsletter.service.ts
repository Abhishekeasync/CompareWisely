import { prisma } from "../db";
import { SubscriberStatus } from "@prisma/client";
import crypto from "crypto";

export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.AUTH_SECRET || "comparewisely-newsletter-secret-token-key-2026";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
}

export async function subscribeNewsletter(email: string, consentIp?: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const token = generateUnsubscribeToken(normalizedEmail);

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email: normalizedEmail },
    update: {
      status: SubscriberStatus.SUBSCRIBED,
      consentAt: new Date(),
      consentIp: consentIp || null,
      unsubscribeToken: token,
    },
    create: {
      email: normalizedEmail,
      status: SubscriberStatus.SUBSCRIBED,
      unsubscribeToken: token,
      consentAt: new Date(),
      consentIp: consentIp || null,
    },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return subscriber;
}

export async function unsubscribeNewsletter(token: string) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    throw new Error("Invalid or expired unsubscribe token.");
  }

  const updated = await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: SubscriberStatus.UNSUBSCRIBED,
    },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  return updated;
}
