import z from "zod";

export const PaginationgMetaSchema = z.object({
  page: z.number().meta({ description: "Page number" }),
  page_size: z.number().meta({ description: "Page size" }),
  total_items: z.number().meta({ description: "Total number of items" }),
  total_pages: z.number().meta({ description: "Total number of pages" }),
  has_next_page: z.boolean().meta({ description: "Indicates if there is a next page" }),
  has_previous_page: z.boolean().meta({ description: "Indicates if there is a previous page" }),
});
export type PaginationgMeta = z.infer<typeof PaginationgMetaSchema>;
