---
title: "Sharing Memory"
date: 2026-11-28
summary: An introduction to embeddings, through the shared memory on my home server, and why I want every LLM call to start from it.
tags: [memory, embeddings, chroma, n8n, litellm, agents]
---

<!-- Outline. The post gets written from this. Move it to src/content/blog/ when it's ready to publish. -->

## 1. What this is for

- Every model starts a conversation knowing nothing about me, so I either repeat myself or paste in whole files.
- The goal is for every LLM call to start with the few facts it needs. That means fewer tokens, answers that stay on topic, and small models that can do more.
- The idea is one memory that Claude Code, my coding agent and the n8n agents all share.
- The rest of the post introduces embeddings, which are what make that work.

## 2. What an embedding is

- An embedding turns text into a list of numbers (768 of them here), and sentences that mean similar things point in similar directions.
- An example pair that shares almost no words but lands close together.
- An embedding model only turns text into numbers and never writes text. It's small enough to run on a CPU.

## 3. Measuring "close"

- Distance, where 0 means identical, in plain terms.
- The measured table: reworded, changed, related, unrelated, question to the right answer, question to a wrong answer.
- What the table shows: a fact said again and a fact that changed land just as close together.

## 4. Storing and searching them

- A vector database holds the text, its numbers and tags you can filter on, and finds the top-k nearest.
- Why Chroma.
- The rule that every vector must come from the same model, which is why everything goes through one `embed` alias.

## 5. From search to memory: RAG

- Look up the closest memories and put them in the prompt. The model itself never learns anything.
- The token comparison: five sentences instead of whole files. This ties back to section 1.

## 6. What embeddings can't do, and the rules that cover it

- A search always returns something, so results past 0.45 are ignored.
- It can't tell "said again" from "changed", so below 0.27 a model judges which it is.
- It handles names and IDs badly, which is a note for later.
- Memory can be poisoned, which is what the trust tags are for.

## 7. The setup: one front door

- Short this time: the memory worker, the five actions, the diagram.
- The token and allowlist, and `ask` as read-only.

## 8. Seeing it work

- `recall` showing a real distance, which links back to section 3.
- `ask` answering, and saying "I don't know" when nothing fits.
- `forget` working from a plain description.
- The poisoned memory being ignored.

## 9. What's next

- Measure it: the same tasks run with and without memory through a Claude Code skill, counting tokens and misses.

## Open questions

- How much maths? Default: a picture of arrows pointing in similar directions, no cosine formulas.
- How much security? Section 7 could drop the Funnel and `X-Forwarded-For` details entirely, since this is an introduction.

## Sources

- The memory worker plan in the server's (private) repo: its Phase 1 and 2 test results.
- The Chroma plan in the same repo: its background, the write rules, and the distance cutoffs measured in its Phase 3.
