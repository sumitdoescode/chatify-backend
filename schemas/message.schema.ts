import * as z from "zod";

export const sendMessageSchema = z.object({
    text: z.string().max(1000, "Message cannot be longer than 1000 characters").optional(),
    image: z.url("Invalid image url").optional(),
});
