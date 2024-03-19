FROM node:21-alpine AS base

# Install git, curl, and bash
RUN apk add --no-cache git curl bash

# Install bun 
RUN curl -fsSL https://bun.sh/install | bash

WORKDIR /app

# Get project code
RUN git clone https://github.com/williamneves/discord-gptbot.git .

# Run ls to see the files
RUN ls -la

# Install dependencies
RUN bun build

# Remove the .git directory for a smaller image
RUN rm -rf .git 

# Set Environment Variables (via docker run) 
CMD ["bun", "start"] 
