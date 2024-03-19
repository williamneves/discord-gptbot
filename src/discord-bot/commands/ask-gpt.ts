import { CommandInteraction, SlashCommandBuilder } from "discord.js"

export const askGpt = new SlashCommandBuilder()
	.setName("ask-gpt")
	.setDescription("Ask GPT a question")
	.addStringOption((option) =>
		option
			.setName("question")
			.setDescription("The question to ask GPT-3")
			.setRequired(true)
	)
	.toJSON()

export const askGptAction = async (interaction: CommandInteraction) => {
	const question = interaction.options.get("question")!.value as string

	await interaction.reply(`You asked: ${question}`)
}
