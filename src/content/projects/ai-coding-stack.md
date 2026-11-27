---
title: AI coding stack
summary: One LiteLLM gateway in front of every model, local and cloud, with n8n workflows, shared memory in Chroma, a coding agent that turns labelled issues into draft PRs, and Tailscale for getting in and out.
status: active
links:
  - label: How it's wired together
    href: /setups/how-my-ai-is-strung-together/
tags: [litellm, n8n, chroma, tailscale, deepseek, ollama, agents]
---

This is the AI side of my home server, and the project I spend most of my time on right now. Everything runs in Docker on the server, except the models on my GPU PC and the cloud ones. Each piece has its own config in git, and merging to `main` deploys it.

## Models and the gateway

- **[LiteLLM](https://github.com/BerriAI/litellm)** is the single OpenAI-compatible endpoint. Every caller (n8n, the coding agent, Claude Code) asks for a model by alias, and I can change the model behind an alias in one file. Each caller has its own key, which lists the aliases it may use and has a budget that resets every 30 days.
- **Local models on [Ollama](https://ollama.com/):** small Gemma models on the server's CPU and on the GPU PC, gpt-oss-20b on the GPU PC for local coding, and `nomic-embed-text` for embeddings in an Ollama of its own. When the GPU PC is asleep, its aliases fall back to the server's CPU.
- **Cloud models:** **DeepSeek V4.1 Flash** on Google Cloud Vertex AI for cloud coding, and Gemini's free tier for experiments. Everything else on Vertex is switched off in the gateway, so nothing reaches a paid model by accident.
- **Postgres** is shared by LiteLLM and n8n and dumped nightly. LiteLLM keeps every prompt and reply there, for a later look at what I actually use these models for.

## Workflows and memory

- **[n8n](https://n8n.io/)** strings model calls and tools together. It names media downloads, carries the coding agent's questions to Discord, and gives any agent built in it the memory and search tools below.
- **[Chroma](https://www.trychroma.com/)** is the vector database behind both:
  - **Shared memory.** Agents get "remember" and "recall" tools, so what one agent learns, another can find later by meaning. Every memory is tagged by where it came from: something I said, something an agent concluded, or something from a web page, email or file. That last kind is fenced off as untrusted whenever it's recalled.
  - **Infrastructure search.** A small service re-indexes my infrastructure repos (docs, configs and scripts, never secrets) within about a minute of a change. A "network lookup" tool answers questions with excerpts that name the repo and file they came from.
  - Chroma has no login, so it isn't on the network at all. Only n8n's Docker network and scripts on the server itself can reach it.

## The coding agent

- **Label a GitHub issue** in one of my infrastructure repos, and a service on the server starts **[OpenHands](https://github.com/All-Hands-AI/OpenHands)** or **[opencode](https://github.com/sst/opencode)** in a fresh sandbox, on the local or the cloud model.
- **The sandbox is boxed in.** It runs on its own Docker daemon and has no GitHub credentials. It can reach only the gateway and the internet, and it gets an hour.
- **The result is a draft PR** that closes the issue. It's pushed by the agent's own GitHub App, so I review and approve it like anyone else's. Changes to CI workflows or `.env` files are refused. Every commit names the tool and the real model behind the alias.
- **Questions come to Discord.** When the agent needs a decision, it asks through an `ask_owner` tool. The question appears in a Discord thread, and my reply goes back to the waiting job.

## Getting in and out

- **[Tailscale](https://tailscale.com/)** is how I reach the server from my phone and laptop, for SSH and for the n8n editor over HTTPS. Neither is open to the internet.
- **Tailscale Funnel** publishes only what has to be public: n8n's production webhook path, and the GitHub webhooks for the coding agent and for repo syncing, which turn away anything without GitHub's signature. The editor and test webhooks stay on a tailnet-only port.
- **The tailnet policy is code.** It lives in its own repo, and CI tests every change on the PR and applies it on merge. CI signs in to Tailscale with GitHub's OIDC identity, so no Tailscale secret is stored anywhere.
- **A Discord bot** keeps one outbound connection, so nothing is exposed for it. It starts a thread per job, and its mentions can only ever reach me.

## Keeping it running

- **CI and deploys:** a self-hosted Forgejo mirrors the repos and runs their checks. A merge deploys only if every check passed, one deploy at a time, and results show on the GitHub PR.
- **Dashboards:** Prometheus and Grafana show requests per model, spend per day, each key's budget, and how many agent jobs are running or waiting on me.

The [setup page](/setups/how-my-ai-is-strung-together/) shows how these pieces connect, with diagrams.
