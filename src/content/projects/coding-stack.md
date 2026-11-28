---
title: Coding stack
summary: How my code gets written and shipped. Claude Code sessions, a coding agent that turns labelled issues into draft PRs, a kanban board the agents keep current over MCP, a home Forgejo for CI and deploys, and Tailscale connecting it all.
status: active
featured: true
tags: [claude-code, n8n, agents, kanzo, forgejo, tailscale, mcp, ci]
---

This is how I build things: the home server's repos, the PCs' setup, and this site. Most of the code is written by Claude Code, in sessions I start and steer. The rest comes from a coding agent that works on its own, starting from a labelled GitHub issue. Everything around those sessions runs at home: the board that tracks the work, the CI that checks it, and the deploy that ships it. GitHub holds the code and the PRs.

[Local AI stack](/projects/local-ai-stack/) covers the models. This page covers how the work moves.

<img class="illustration" src="coding-stack.svg" alt="Overview of the coding stack: my PC (Claude Code app, claude in a terminal) and the home server (Forgejo, Kanzo, LiteLLM, Docker stacks) on one Tailscale tailnet, with GitHub, Anthropic and Vertex AI in the cloud.">

The pieces:

| Piece | What it does here |
|---|---|
| **Claude Code** | Writes the code, as the desktop app's Code tab or the `claude` command in a terminal |
| **[Kanzo](https://github.com/emanuele-em/kanzo)** | The kanban board for every project. People and agents both use it, the agents over MCP. |
| **[Forgejo](https://forgejo.org/)** | Runs CI on copies of the GitHub repos, reports the results on the PR, and deploys on merge |
| **The coding agent** | Turns a labelled GitHub issue into a draft PR, and asks me questions in Discord through n8n |
| **[Tailscale](https://tailscale.com/)** | Connects my machines, and opens the few doors the internet needs |

## How a change goes

Every change follows the same path.

```mermaid
flowchart TB
  subgraph write ["Write"]
    direction LR
    plan["Plan<br/>in the repo"] --> cards["Cards<br/>on Kanzo"] --> session["Claude Code<br/>session"] --> pr["PR on GitHub"]
  end
  subgraph ship ["Ship"]
    direction LR
    ci["Forgejo<br/>checks"] --> merge["I merge"] --> deploy["Deploy"] --> discord["Discord<br/>✅ or ❌"]
  end
  write --> ship
```

1. **A plan.** Anything bigger than a quick fix starts as a plan file in the repo it changes, `plans/<topic>-plan.md`. A plan has a goal, numbered decisions with dates and reasons, and phases, each with a "done when" line. I write plans with Claude Code and review them like any other change.
2. **Cards.** Filing the plan's cards on Kanzo is Phase 0, before any building starts. Each phase gets one card, tagged with the plan, and `waits_on` links set the order.
3. **A session.** I start a Claude Code session on a card. It moves the card to *doing*, works in its own git worktree on its own branch, and comments on the card as it goes.
4. **A PR.** The session pushes and opens a PR, and puts the PR's link on the card. Every commit and PR says which model wrote it.
5. **Checks.** Forgejo picks up the push within seconds and runs the checks. The results show on the GitHub PR, and a red check goes back to the session to fix.
6. **Merge and deploy.** I review and merge, as a merge commit, never squashed. The merge runs the checks again and then deploys.
7. **Done.** The session moves its card to *review*, and I move it to *done*. Agents never mark a card done.

## Claude Code

[Claude Code](https://claude.com/claude-code) is where nearly all the code comes from. I use it two ways.

**The desktop app's Code tab** is the main one. Each task gets its own session and its own git worktree, so several can run at once without touching each other's files, and a session can reach into more than one repo when a change spans them. A session can use the board over MCP, a browser it can drive to check a page it just built, and `gh` for GitHub.

**`claude` in a terminal** is the same tool with a different model behind it. Two small PowerShell launchers start it against my own models instead of Anthropic's:

```mermaid
flowchart LR
  subgraph pc ["My PC"]
    direction TB
    cc["cloud-code"]
    lc["local launcher"]
    proxy["schema proxy"]
  end
  gw["LiteLLM<br/>cloud-manual-coder"]
  ds["DeepSeek<br/>on Vertex AI"]
  ol["Ollama<br/>on the GPU"]
  cc --> proxy --> gw --> ds
  lc --> ol
```

- **`cloud-code`** sends every model tier to the gateway's `cloud-manual-coder` alias, with a key of its own and a 30-day budget. A tiny local proxy sits in between. It strips the lookaround patterns out of Claude Code's tool schemas, because Vertex AI's grammar compiler rejects them.
- **The local launcher** points Claude Code at Ollama on the GPU and sets compaction from the model's real context size, so a long session doesn't overrun a small model.

### The rules every session follows

The same instructions load into every session, so the work comes out the same whichever session did it:

- **A global `CLAUDE.md`** holds my own rules. Sign every commit and PR with the real model's name. Leave the local clone on an up-to-date `main` when the work is done. Treat my three machine repos as one template, so a change to one is planned across all three.
- **Each repo has an `AGENTS.md`** with what an agent in that repo keeps tripping over: how to set up a worktree, which checks to run, what never to publish. `CLAUDE.md` in the repo just points to it, so other agents read the same file.
- **Skills** for the jobs that repeat. One writes PR descriptions in a fixed shape. Another strips the tells of machine writing out of anything I'll publish, this page included.

### Watching it

Claude Code sends its usage to Prometheus over OpenTelemetry: tokens, estimated cost, sessions, active time and lines changed. A Grafana dashboard on the PC shows it.

## The coding agent

Claude Code needs me in the session. For work I can hand off, a coding agent on the home server takes a GitHub issue and comes back with a draft PR. [n8n](https://n8n.io/) connects it to Discord, so the agent can ask me questions while it works.

```mermaid
sequenceDiagram
  participant Me
  participant GH as GitHub
  participant A as Agent service
  participant S as Sandbox
  participant N as n8n
  participant D as Discord
  Me->>GH: Label the issue
  GH->>A: Webhook, through Funnel
  A->>N: Job started
  N->>D: A thread for the job
  A->>S: Clone, start the agent
  S->>A: ask_owner
  A->>N: The question
  N->>D: Post it in the thread
  Me->>D: Reply
  D->>N: Discord reply workflow
  N->>A: The answer
  A->>S: Carry on
  S-->>A: Commits and a summary
  A->>GH: Push, draft PR
  A->>N: Ready for review
  N->>D: The PR link
```

- **The label picks the model.** `agent:local` runs on gpt-oss-20b on the GPU PC, and `agent:cloud` on DeepSeek on Vertex AI. Both go through the gateway, with the agent's own key and a monthly budget. One local job and two cloud jobs run at once, and the rest wait their turn.
- **n8n does the talking.** The agent service never talks to Discord itself. It hands each status line and question to an n8n workflow, which posts it through a small Discord bot, one thread per job. My reply in the thread goes to a second workflow, which passes it to the waiting job. A job's one-hour clock stops while it waits, for up to 24 hours and three questions.
- **A sandbox with nothing to steal.** Each job runs in a fresh container on its own Docker daemon, with [OpenHands](https://github.com/All-Hands-AI/OpenHands) or [opencode](https://github.com/sst/opencode) inside. The container has no GitHub credentials. It can reach the gateway and the internet, and nothing else on my network.
- **Checked before it pushes.** The service refuses a change to a CI workflow or an `.env` file, and a change without a summary. Otherwise it pushes a new branch and opens a draft PR that closes the issue. A failed job comments why on the issue and pushes nothing.
- **Its own name on GitHub.** The service pushes and comments as a GitHub App, so its PRs come from a bot, and I review and approve them like anyone else's. Forgejo runs the same checks on them as on mine.
- **Signed like everything else.** Every commit names the tool and the real model behind the alias. If the agent forgets the trailer, the service adds it before pushing.

## Kanzo, the board

[Kanzo](https://github.com/emanuele-em/kanzo) is a small kanban board in Rust, with an MCP endpoint built in. It's meant to run on a laptop. Mine runs in Docker on the home server, from a small image built around the release binary, so every machine shares one board.

```mermaid
sequenceDiagram
  participant Me
  participant CC as Claude Code
  participant K as Kanzo
  participant GH as GitHub
  Me->>CC: Work on the next card
  CC->>K: next_task
  K-->>CC: The card and its plan
  CC->>K: Move to doing
  CC->>GH: Push, open PR
  CC->>K: Comment, add the PR link
  CC->>K: Move to review
  Me->>K: Move to done
```

- **One board, every project.** Each repo is a project on the board, and a card is named like `site#12`. Tags say which plan a card belongs to (`plan:<topic>`) and which features it touches (`feature:<slug>`), so one filter lists everything for a plan across every project.
- **Agents keep it current.** The MCP server tells every agent that connects to move a card to *doing* when it starts, comment on what it did, add the URL of any PR it opens, and move the card to *review* when it finishes or gets stuck. *Done* is mine, and so are cards marked for a person. I don't have to remind a session to do any of it.
- **The cards are the plan's status.** Where a plan stands is on its cards, not in the repo. Each plan still has a checklist of what was checked, and the two move together: ticking an item means moving its card in the same change.
- **No logins, so no Funnel.** Kanzo has no accounts. It's open to my own network and the tailnet, and is never published through Funnel.
- **Backed up as readable pages.** Every 15 minutes, a Forgejo workflow takes a consistent copy of the board's SQLite database. If anything changed, it renders the board as linked Markdown pages and commits them to a private repo, which GitHub shows as a board you can click through. A board nobody touched makes no commit.

## Forgejo, the CI

GitHub keeps the code and the PRs. A self-hosted [Forgejo](https://forgejo.org/) runs the checks and the deploys, on my own hardware, with no paid CI minutes.

```mermaid
flowchart TB
  gh["GitHub"] -- "webhook" --> sync["sync service"]
  sync -- "push branches" --> fj["Forgejo"]
  fj --> ci["Branch runner<br/>checks only"]
  fj --> cim["main runner<br/>checks, then deploy"]
  cim --> host["Host runner<br/>docker compose up"]
  ci -- "status" --> gh
  cim -- "status" --> gh
  host -- "result" --> disc["Discord"]
```

- **Copies of the GitHub repos.** A small sync service fetches each repo from GitHub and pushes its branches and tags into Forgejo. It runs every two minutes and also right after GitHub's webhook says something changed. Forgejo's copies have no issues or PRs, and nobody pushes to them by hand.
- **Runners kept apart.** Branch checks run in containers on Forgejo's own Docker daemon, so a job can't see the server's real containers. `main` has its own runner, so a merge never waits behind branch pushes. Only the deploy job runs on the host itself.
- **The checks.** Tests, shellcheck, `docker compose config` for every stack, the Prometheus rules, the dashboards, the systemd units, and a secrets scan. Each check is one script, and runs the same by hand as in CI.
- **Results on the PR.** Each check shows as a status on the GitHub commit. The PR description also gets a CI table that the runs keep up to date, with a column for the PR's own commit and, once merged, one for `main`.
- **Deploys roll back.** A merge deploys only if every check passed. Merges deploy one at a time and are never cancelled. The deploy rebuilds only the stacks that changed and waits for them to be healthy. If one isn't, it puts every stack it touched back to the old commit. Each deploy posts a start line and a ✅ or ❌ in a Discord channel, and shows as a marker on the server's Grafana dashboard.
- **The same themes as this site.** Forgejo uses both [themes](/projects/themes/), Neon Terminal in dark mode and Tidewater in light.

## Tailscale, the network

[Tailscale](https://tailscale.com/) puts my PC, the server, my phone and my laptop on one private network, wherever they are.

```mermaid
flowchart LR
  subgraph net ["Internet"]
    ghw["GitHub webhooks"]
    n8nw["n8n webhook callers"]
  end
  subgraph tn ["Tailnet only"]
    ssh["SSH"]
    board["Kanzo, Forgejo"]
    editor["n8n editor"]
  end
  funnel["Funnel<br/>three paths"]
  ghw --> funnel
  n8nw --> funnel
  funnel --> server["Home server"]
  tn --> server
```

- **Tailnet only.** SSH, the board, Forgejo, Grafana and the n8n editor. Nothing is forwarded on the router.
- **Funnel, for what has to be public.** Only three paths are on the internet: the GitHub webhook for the repo sync, the one for the coding agent, and n8n's production webhook. Every path on a Funnel port is public, so the n8n editor sits on a second, tailnet-only port. Both GitHub endpoints turn away any call without GitHub's signature.
- **The setup is a script.** The server's Tailscale install, settings and Funnel paths come from a script in its repo, checked against a saved snapshot. Running it again on a server that's already set up changes nothing.
- **The policy is code.** The tailnet's access rules live in their own repo. CI tests every change on the PR and applies it on merge, signing in with GitHub's OIDC identity, so no Tailscale secret is stored anywhere.
