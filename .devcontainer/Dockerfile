ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

RUN apt update && export DEBIAN_FRONTEND=noninteractive \
    && apt -y install --no-install-recommends \
        bash-completion \
    && apt clean

RUN su node -c "npm install -g npm vsce"

USER node
RUN echo "alias ll='ls -laF'" > ~/.bash_aliases

