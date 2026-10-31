import { Prisma } from "@prisma/client";

/**
 * Deep-clones Prisma query results into plain JSON-safe values for RSC → Client
 * props and API responses (e.g. Decimal → number).
 */
export function serializeForClient<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (Prisma.Decimal.isDecimal(val)) {
        return val.toNumber();
      }
      return val;
    })
  ) as T;
}
