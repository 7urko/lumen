# Build Alto (Pimlico's open-source ERC-4337 bundler) from source.
# No SaaS — this is software you run yourself. Verify the build locally; the
# upstream repo can change. Alto needs Node 20, pnpm, and Foundry (forge).

FROM ghcr.io/foundry-rs/foundry:latest AS foundry

FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates curl bash \
    && rm -rf /var/lib/apt/lists/*

# Bring Foundry's forge/cast/anvil over (Alto's contract build needs forge).
COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge
COPY --from=foundry /usr/local/bin/cast  /usr/local/bin/cast
COPY --from=foundry /usr/local/bin/anvil /usr/local/bin/anvil

RUN corepack enable
WORKDIR /app

# Pin to a commit/tag in production. `--depth 1` of main for now.
RUN git clone --depth 1 https://github.com/pimlicolabs/alto.git .
RUN pnpm install --frozen-lockfile && pnpm build:all

EXPOSE 4337
# Config is mounted at /config/alto-config.json by docker-compose.
ENTRYPOINT ["./alto", "run", "--config", "/config/alto-config.json"]
