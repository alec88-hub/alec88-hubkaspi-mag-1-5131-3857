import { z } from "zod";
import { base } from "../__core/app";
import { getCatalog, productReviews } from "../lib/catalog";
export const catalog = {
  list: base.handler(() => getCatalog()),
  reviews: base
    .input(z.object({ id: z.string(), page: z.number().int().min(1).default(1) }))
    .handler(({ input }) => productReviews(input.id, input.page)),
};
