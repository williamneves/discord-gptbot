import {
	ChannelType,
	Client,
	Events,
	GatewayIntentBits,
	IntentsBitField,
	PublicThreadChannel,
	REST,
	Routes,
} from "discord.js"

import * as serverQueies from "../db/server.model"
import { askGptAction, askGpt } from "./commands/ask-gpt"
import {
	DiscordToOpenAIMessage,
	discordToOpenAIMessage,
} from "../types/discord-bot"
import { forumGPT } from "../openai/forum-gpt"

const TOKEN = Bun.env.DISCORD_BOT_TOKEN!

const COMMANDS = [askGpt]

export const startDiscordServer = async () => {
	let clientId: string

	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			IntentsBitField.Flags.Guilds,
			IntentsBitField.Flags.GuildMessages,
			IntentsBitField.Flags.MessageContent,
		],
	})

	const rest = new REST().setToken(Bun.env.DISCORD_BOT_TOKEN!)

	client.once(Events.ClientReady, async (c) => {
		clientId = c.user.id
		console.log(
			`Ready! Logged in as ${c.user.id} ${c.user.tag} ${c.user.username} ${c.user.discriminator}`
		)

		c.guilds.cache.forEach(async (guild) => {
			// Check if the server is in the database
			try {
				const server = await serverQueies.getServer(guild.id)

				if (!server) {
					// Add the server to the database
					console.log(
						"Adding server to database: ",
						guild.id,
						guild.name,
						new Date(guild.joinedTimestamp)
					)

					await serverQueies.createServer(
						guild.id,
						guild.name,
						new Date(guild.joinedTimestamp)
					)
				}
			} catch (error) {
				console.log("Error getting server: ", error)
			}
		})

		// Define the slash command on ready
		try {
			// Register the slash command as a global command
			await rest.put(Routes.applicationCommands(clientId), {
				body: [...COMMANDS],
			})

			console.log("Successfully registered the global slash command.")
		} catch (error) {
			console.error(error)
		}
	})

	client.on(Events.GuildCreate, async (guild) => {
		try {
			// Register the slash command for the new guild
			await rest.put(Routes.applicationGuildCommands(clientId, guild.id), {
				body: [...COMMANDS],
			})

			console.log(
				`Successfully registered slash command for guild: ${guild.name}`
			)

			// Add the server to the database
			console.log(
				"Adding server to database: ",
				guild.id,
				guild.name,
				new Date(guild.joinedTimestamp)
			)
			await serverQueies.createServer(
				guild.id,
				guild.name,
				new Date(guild.joinedTimestamp)
			)

			console.log("Successfully added server to database.")
		} catch (error) {
			console.error(error)
		}
	})

	client.on(Events.InteractionCreate, async (interaction) => {
		// If the interaction isn't a slash command, return
		if (!interaction.isCommand()) return

		// If the interaction is a slash command, check the name
		if (interaction.commandName === "ask-gpt") {
			console.log("askgpt")
			await askGptAction(interaction)
		}
	})

	// ** MESSAGES EVENT
	client.on(Events.MessageCreate, async (m) => {
		// Get Messages from ask-gpt-topics channel
		if (m.author.bot) return

		const isAskGptTopicsChannel = (
			m.channel as PublicThreadChannel
		).parent?.name.includes("ask-gpt-topics")

		if (isAskGptTopicsChannel) {
			if (m.attachments.size > 0) {
				m.reply("Sorry, I can't process this message type")
				return
			}

			console.log("isAskGptTopicsChannel")
			const channel = m.channel as PublicThreadChannel
			const repliedMessage = !!m.reference ? await m.fetchReference() : null

			const message = await discordToOpenAIMessage.safeParseAsync({
				text: m.content,
				author: {
					id: m.author.id,
					username: m.author.username,
				},
				isOwner: channel.ownerId === m.author.id,
				createdAt: m.createdAt.toISOString(),
				isReply: !!m.reference,
				repliedMessage: repliedMessage
					? {
							text: repliedMessage.content,
							author: {
								id: repliedMessage.author.id,
								username: repliedMessage.author.username,
							},
							createdAt: repliedMessage.createdAt.toISOString(),
						}
					: null,
			} satisfies DiscordToOpenAIMessage)

			if (message.success) {
				console.log("message", message.data)

				const fetchedHistory = await channel.messages.fetch({ limit: 20 })

				const contextMessages = (await Promise.all(
					fetchedHistory.map(async (m) => {
						const channel = m.channel as PublicThreadChannel
						const repliedMessage = !!m.reference
							? await m.fetchReference()
							: null
						return discordToOpenAIMessage.safeParse({
							text: m.content,
							author: {
								id: m.author.id,
								username: m.author.username,
							},
							isOwner: channel.ownerId === m.author.id,
							createdAt: m.createdAt.toISOString(),
							isReply: !!m.reference,
							repliedMessage: repliedMessage
								? {
										text: repliedMessage.content,
										author: {
											id: repliedMessage.author.id,
											username: repliedMessage.author.username,
										},
										createdAt: repliedMessage.createdAt.toISOString(),
									}
								: null,
						} satisfies DiscordToOpenAIMessage)
					})
				).then((results) =>
					results
						.filter((m) => m.success)
						.map((m) => m.success && m.data)
						.reverse()
				)) as DiscordToOpenAIMessage[]

				console.log("contextMessages", contextMessages)

				await m.channel.sendTyping()
				const gptResponse = await forumGPT({
					inputMessages: {
						message: message.data,
						history: contextMessages ?? [],
					},
				})

				console.log("gptResponse", gptResponse)

				if (gptResponse) {
					// Reply with the GPT response
					await m.reply(gptResponse)
					return
				} else {
					// Reply saing that message type is not supported
					await m.reply("Sorry, something went wrong... :(")
					return
				}

				// Reply with the GPT response
			} else {
				// Reply saing that message type is not supported
				await m.reply("Sorry, I can't process this message type")
			}
		}

		// Ignore messages from bots

		// Log the message
		// console.log(JSON.stringify(message, null, 2))

		// if (
		// 	// Mention
		// 	m.content.includes("@" + clientId) ||
		// 	// Command
		// 	m.content.toLocaleLowerCase().includes("!gpt") ||
		// 	// Reply
		// 	m.mentions?.repliedUser?.bot
		// ) {
		// 	// Send typing indicator
		// 	// await message.channel.sendTyping()
		// 	// Generate a response
		// 	// try {
		// 	// 	const response = await gptResponse(message)
		// 	// 	// @ts-ignore
		// 	// 	if (response) {
		// 	// 		await message.channel.send(response)
		// 	// 	} else {
		// 	// 		await message.channel.send("Something went wrong... :(")
		// 	// 	}
		// 	// } catch (error) {
		// 	// 	console.log("Error generating response: ", error)
		// 	// 	await message.channel.send("Something went wrong... :(")
		// 	// }
		// }
	})

	client.login(TOKEN)
}
