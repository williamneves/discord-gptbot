import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import { slashGPT } from "../../openai/slash-gpt"

export const askGpt = new SlashCommandBuilder()
	.setName("ask-gpt")
	.setDescription("Pergunte ao GPT. (Ele não tem acesso ao histórico do chat)")
	.addStringOption((option) =>
		option
			.setName("question")
			.setDescription("A pergunta que você quer fazer ao GPT.")
			.setRequired(true)
	)
	.toJSON()

export const askGptAction = async (interaction: CommandInteraction) => {
	const question = interaction.options.get("question")!.value as string

	try {
		const response = await slashGPT(question)

		if (!response) {
			await interaction.reply(
				"I'm sorry, I don't know the answer to that question."
			)
			return
		}

		const reply = `**Pergunta**: ${question}\n\n\n**Resposta**: ${response}`

		await interaction.reply(reply)

		return
	} catch (error) {
		console.error("askGptAction error", error)
		await interaction.reply(
			"I'm sorry, I don't know the answer to that question."
		)
		return
	}
}
