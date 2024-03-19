import { ChatGPTModelEnum, oai } from "./openai.config"
import {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionSystemMessageParam,
} from "openai/src/resources/index.js"

const SYSTEM_FORUM_MESSAGE: ChatCompletionSystemMessageParam = {
	role: "system",
	content:
		"Você é um expert em programaçao. Responda a questão de forma sucinta, fácil de entender. Você tem um limite de 250 caracteres. Seja claro e objetivo.",
	name: "System",
}

export const slashGPT = async (
	// Type of createChatCompletion parameters
	message: string,
	model: ChatGPTModelEnum = ChatGPTModelEnum.GPT3
) => {
	const messages = [
		SYSTEM_FORUM_MESSAGE,
		{ role: "user", content: message, name: "User" },
	]

	try {
		const response = await oai.chat.completions.create({
			model,
			messages: messages as ChatCompletionCreateParamsNonStreaming["messages"],
			max_tokens: 250,
		})

		return response.choices[0].message.content
	} catch (error) {
		console.error("chatGPT error", error)
	}
}
