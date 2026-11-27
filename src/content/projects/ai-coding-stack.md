---
title: AI coding stack
summary: One LiteLLM gateway in front of every model, local and cloud, with n8n workflows and a coding agent that turns labelled issues into draft PRs.
status: active
links:
  - label: How it's wired together
    href: /setups/how-my-ai-is-strung-together/
tags: [litellm, n8n, deepseek, ollama, agents]
---

This is the AI side of my home server, the project I spend most of my time on right now.

- **LiteLLM** is the single OpenAI-compatible endpoint. Every caller (n8n, the coding agent, Claude Code) asks for a model by alias. Each caller has its own key, which lists the models it may use and has a monthly budget.
- **Models:** small Gemma models on Ollama, on the server's CPU and on a PC with a GPU, for local work. **DeepSeek V4.1 Flash** on Google Cloud Vertex AI for cloud coding. Gemini's free tier for experiments.
- **n8n** strings model calls and tools together: naming media downloads, a shared memory for agents in Chroma, and search across my infrastructure repos.
- **The coding agent:** label a GitHub issue and it runs OpenHands or opencode in a sandbox, then opens a draft PR under its own GitHub App. If it needs to ask me something, the question comes to Discord.

The [setup page](/setups/how-my-ai-is-strung-together/) has the diagram and the details.
