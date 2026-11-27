---
title: Example setup
summary: A draft setup page. Setups describe how things connect, never private addresses or account details.
updated: 2026-11-26
tags: [example]
draft: true
---

Setup pages are living documents: edit them in place and bump `updated`.

```mermaid
flowchart LR
  pc["Desktop"] -- "SSH" --> server["Home server"]
  server --> agents["Coding agents"]
```
