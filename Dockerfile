# Use the official Bun image
FROM oven/bun AS base

WORKDIR /app

# Install git, curl, and bash
# Update package lists, install packages, and clean up in one RUN to keep the image size small
RUN apt-get update && \
  apt-get install -y git curl bash && \
  curl -fsSL https://deb.nodesource.com/setup_21.x | bash - && \
  apt-get install -y nodejs && \
  rm -rf /var/lib/apt/lists/*

# Get project code (not cached)
ARG CACHEBUST=1
RUN git clone https://github.com/williamneves/discord-gptbot.git .
# Since we're using the Bun image, Bun is already installed, and we can directly use it
# RUN bun build

# Remove the .git directory for a smaller image
RUN rm -rf .git

# RUN bun install

# RUN bunx prisma generate

# RUN bunx prisma db push

# Set Environment Variables (via docker run)
# CMD ["bun", "install"]
# Keep the container running for debugging/development purposes
# CMD ["tail", "-f", "/dev/null"]
CMD ["bun", "start:init"]