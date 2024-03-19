import OpenAI from "openai"
import type { ChatCompletionAssistantMessageParam } from "openai/resources/index.mjs"

export const oai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export enum ChatGPTModelEnum {
	GPT3 = "gpt-3.5-turbo-0125",
	GPT4 = "gpt-4-0125-preview",
}

export const chatGPT = async (
	// Type of createChatCompletion parameters
	messages: ChatCompletionAssistantMessageParam[],
	model: ChatGPTModelEnum = ChatGPTModelEnum.GPT3
) => {
	try {
		const response = await oai.chat.completions.create({
			model,
			messages,
		})

		return response.choices[0].message.content
	} catch (error) {
		console.error("chatGPT error", error)
	}
}
