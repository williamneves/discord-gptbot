import {
	ChatCompletionAssistantMessageParam,
	ChatCompletionSystemMessageParam,
} from "openai/resources/index.mjs"
import { ChatGPTModelEnum, oai } from "./openai.config"
import openaiTokenCounter from "openai-gpt-token-counter"
import { GPTTokens } from "gpt-tokens"
import {
	DiscordToOpenAIMessage,
	DiscordToOpenMessageHistory,
} from "../types/discord-bot"
import { ChatCompletionUserMessageParam } from "openai/src/resources/index.js"
import { anthropic } from "./claude.config"

const SYSTEM_FORUM_MESSAGE: ChatCompletionSystemMessageParam = {
	role: "system",
	content:
		"Voce é um BOT para ajudar desenolvedores a aprender a programar, priorize clareza e exemplos, utilizando termos técnicos em inglês como 'string' e 'arrays'. Guie os estudantes para que encontrem as respostas por si mesmos, mantendo a cordialidade. Use JS como padrão na ausência de especificação de linguagem. Formate suas respostas com markdown, e para código, use blocos com três crases e a linguagem para realce de sintaxe. Responda somente a questões de programação e seja SUCINTO na RESPOSTA! Tente nao dar respostas ou funcoes prontas (apenas iniciar, deixar a logica pra ele), mas sim guiar o estudante a encontrar a resposta ou criar sua funcao por si mesmo, ajude com test cases para facilitar o teste. Seja claro e objetivo.",
	name: "System",
}

function parseMessage({
	message,
}: {
	message: DiscordToOpenAIMessage
}): ChatCompletionAssistantMessageParam | ChatCompletionUserMessageParam {
	let content
	// Check if the message is a reply
	if (message.isReply && message.repliedMessage) {
		content = `> Reply to ${message.repliedMessage.author.username}:\n${message.repliedMessage.text}\n\n${message.text}`
	} else {
		content = message.text
	}

	// Add datetime
	// content += `\n\nsent at: ${message.createdAt}`

	return {
		role: message.author.username.includes("bot") ? "assistant" : "user",
		content,
		name: message.author.username,
	}
}

export const forumGPT = async ({
	inputMessages,
}: {
	inputMessages: DiscordToOpenMessageHistory
}) => {
	const message = parseMessage({ message: inputMessages.message })

	const context = inputMessages.history
		.filter((m) => m.createdAt !== inputMessages.message.createdAt)
		.map((m) => parseMessage({ message: m }))

	const messages = [SYSTEM_FORUM_MESSAGE, ...context, message]

	console.log("messages", messages)

	console.log("sending messages to GPT-3.5-turbo-0613")
	const response = await oai.chat.completions.create({
		model: ChatGPTModelEnum.GPT3,
		messages: [message],
		max_tokens: 400,
	})

	return response.choices[0].message.content

	// const claudeResponse = await anthropic.messages.create({
	// 	model: "claude-3-haiku-20240307",
	// 	max_tokens: 400,
	// 	messages: [message].map((m) => ({
	// 		role: m.role as "user" | "assistant",
	// 		content: m.content as string,
	// 	})),
	// })

	// console.log("claudeResponse", claudeResponse)

	// return claudeResponse.content[0].text
}
