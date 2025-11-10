import z from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().meta({
    title: "Name of the user (it's not unique)",
  }),
  email: z.string(),
});
export type User = z.infer<typeof UserSchema>;
