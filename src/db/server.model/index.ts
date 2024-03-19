import p from "../prisma"

export async function createServer(
	guildId: string,
	name: string,
	joinedTimestamp: Date
) {
	const server = await p.server.create({
		data: {
			guild_id: guildId,
			guild_name: name,
			joined_timestamp: joinedTimestamp,
		},
	})

	return server
}

export async function getServer(guildId: string) {
	const server = await p.server.findFirst({
		where: {
			guild_id: guildId,
		},
	})

	return server
}

export async function getAllServers() {
	const servers = await p.server.findMany()

	return servers
}

export async function updateServer(guildId: string, data: any) {
	const server = await p.server.update({
		where: {
			guild_id: guildId,
		},
		data,
	})

	return server
}

export async function deleteServer(guildId: string) {
	const server = await p.server.delete({
		where: {
			guild_id: guildId,
		},
	})

	return server
}
