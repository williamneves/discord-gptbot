import { z } from "zod"

const authorSchema = z.object({
	id: z.string(),
	username: z.string(),
})

export const discordToOpenAIMessage = z.object({
	text: z.string(),
	author: authorSchema,
	isOwner: z.boolean(),
	createdAt: z.string(),
	isReply: z.boolean(),
	repliedMessage: z
		.object({
			text: z.string(),
			author: authorSchema,
			createdAt: z.string(),
		})
		.nullable(),
})

export const discordToOpenMessageHistory = z.object({
	message: discordToOpenAIMessage,
	history: z.array(discordToOpenAIMessage),
})

export type DiscordToOpenMessageHistory = z.infer<
	typeof discordToOpenMessageHistory
>

export type DiscordToOpenAIMessage = z.infer<typeof discordToOpenAIMessage>
