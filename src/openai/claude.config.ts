import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
	apiKey: Bun.env.ANTHROPIC_API_KEY,
})
