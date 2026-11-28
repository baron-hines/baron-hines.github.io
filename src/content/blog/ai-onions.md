---
title: "AI onions: layers can make you cry"
date: 2026-11-28
summary: Running Claude Code on DeepSeek through LiteLLM and Vertex AI, and why most of the bugs lived between the layers, not in the model.
tags: [deepseek, litellm, claude-code, vertex-ai, agents]
draft: true
---

I wanted Claude Code's agent loop running on a cheaper model that I control, with a budget and a log of every request. The model I picked is DeepSeek V4.1 Flash, served by Google's Vertex AI. Claude Code doesn't talk to Vertex, so every request goes through a few other programs first.

Here is the path a single request takes, drawn as what it is, an onion:

```mermaid
flowchart TB
  subgraph cc ["Claude Code"]
    subgraph launcher ["cloud-code, my launcher script"]
      subgraph proxy ["a local schema proxy"]
        subgraph litellm ["LiteLLM, on my home server"]
          subgraph vertex ["Vertex AI"]
            ds(["DeepSeek V4.1 Flash"])
          end
        end
      end
    end
  end
```

Each layer speaks its own dialect. Claude Code speaks Anthropic's Messages API. LiteLLM turns that into OpenAI's chat format for Vertex. DeepSeek writes its tool calls in its own markup, called DSML, and something on Vertex's side turns those back into JSON. A tool call crosses four formats on the way in and the same four on the way out.

Across 15 sessions, 15.0% of DeepSeek's 1,208 tool calls failed. Claude, doing the same kind of work in the same tool, failed 3.8% of 22,080. My initial guess was that this would only be a matter of model settings, but it uncovered a lot of complexity I wasn't giving enough thought to. Here are the layers from the outside in, and what each one did to me.

## Claude Code

The first thing I noticed was the context meter. I'd read a file of about 100 tokens and the meter at the bottom would jump past 64%.

Of course the meter had to be lying, right? Proxies sometimes count cached tokens twice, so I sent the same request twice and compared the `usage` LiteLLM reported:

```json
{"input_tokens": 3609, "output_tokens": 5}
{"input_tokens": 25, "output_tokens": 10, "cache_read_input_tokens": 3584}
```

The second reply's 25 new tokens plus 3,584 cached ones add up to the first reply's 3,609. The meter was honest.

The tokens were real. A one-word prompt cost 44,073 input tokens. As far as I can tell, with Anthropic's own API Claude Code sends only the names of most tools and loads a tool's full schema when it needs one. Against any other backend, it sends every schema in full, on every request. I caught one request with a throwaway local listener and measured each tool's schema:

```text
tools: 40, total chars: 148414

name               chars
Artifact           38340
ArtifactData       12241
DesignSync         11231
PowerShell          9335
ArtifactComments    8228
Monitor             7568
...
```

The four claude.ai artifact tools at the top come to about 70,000 characters, roughly 18,000 tokens, and they can't work through LiteLLM at all.

Claude Code has a `--disallowedTools` flag, and it removes tools from the request, not just from what the model may call. Turning off 12 tools I never use there brought the same one-word prompt down to 20,042 tokens.

## The launcher

`cloud-code` is a PowerShell script that checks LiteLLM is up, reads the key's budget, starts the local proxy and then runs `claude`. It's glue code, and glue code breaks too.

This command failed:

```text
PS> cloud-code -NoWorktree -p "Reply with just OK" --output-format json
Exception: The key can't use '--output-format'. It may use: cloud-manual-coder
```

PowerShell binds arguments it doesn't recognize to parameters by position. `--output-format` isn't a PowerShell-style parameter, so it landed in `-Model`, and the script went looking for a model called `--output-format`. A bare prompt like `cloud-code "fix the tests"` would have done the same. The fix was to stop using a `param()` block and match the script's own options by exact name, passing everything else to `claude` in order.

This isn't an AI bug, but it showed how simple choices were adding complexity. A lot of this comes from using a brand new stack, but it's still humbling to realize how many of the problems you caused yourself.

## The schema proxy

This layer exists only to keep two other layers compatible. A few of Claude Code's tool schemas restrict a string with a regular expression that uses lookahead. This is one of them, for a document id:

```json
"doc_id": {
  "type": "string",
  "pattern": "^(?!\\.\\.?(?:\\/|$))[A-Za-z0-9_\\-.~:@+]{1,200}$"
}
```

The `(?!` is a negative lookahead, which here stops an id like `..`. The grammar compiler on Vertex rejects lookaround, and the whole request fails. A small Python proxy on my PC strips those patterns from each request before it goes out and passes everything else through untouched.

When I went looking for this example, every lookaround pattern in the request turned out to belong to `ArtifactData`, one of the artifact tools I'd just turned off. The proxy may have nothing left to strip. I'm keeping it until a Claude Code update proves otherwise.

## LiteLLM

LiteLLM is the gateway on my home server, and it's the layer that made the rest fixable. Callers ask for an alias like `cloud-manual-coder`, never a vendor's model name. Each tool gets its own key with a monthly budget, so a runaway loop costs at most that budget.

The aliases also made benchmarking easy. Each model I tried was an entry behind an alias, so swapping the model under test meant changing one name, not rewiring the benchmark.

It's also where a fix can go once and reach every caller. My coding agent and Claude Code both use DeepSeek through it. This week I gave both aliases a default temperature and added a callback that cleans DeepSeek's markup out of tool arguments, and both clients got them without a change on their side:

```yaml
- model_name: cloud-manual-coder
  litellm_params:
    model: vertex_ai/deepseek-ai/deepseek-v4.1-flash-maas
    timeout: 600
    temperature: 0.3   # a default: a request's own temperature still wins
```

It's also another translator, and it changes requests without saying so. Every request Claude Code sends asks for extended thinking:

```json
{
  "max_tokens": 32000,
  "thinking": {"type": "adaptive"},
  "output_config": {"effort": "high"}
}
```

LiteLLM translates that into a `reasoning_effort` parameter, and because my config has `drop_params: true`, it then drops that parameter for this model without a word. In 2,369 DeepSeek replies, not one had any reasoning in it, and nothing anywhere said why.

When I turned reasoning on deliberately, it got worse. On two tool calls with escaping that's easy to get wrong, reasoning off produced 104 exact results out of 105. Reasoning on produced 98 out of 110. On the harder of the two, the median latency went from 2.9 seconds to 13.6, the slowest took 65, and three runs thought until they hit the 4,000-token limit without ever making the call. It stayed off.

## Vertex and DeepSeek's markup

The next layer in is where DeepSeek's own markup appeared. In 67 of the 1,208 calls, DeepSeek's DSML tags ended up inside the arguments instead of being parsed out. Here is one Bash call as it reached Claude Code:

```json
{
  "command": "grep -n 'CHANGELOG' README.md | head -20</｜DSML｜parameter>Nope.</｜DSML｜parameter>\n</invoke></｜DSML｜parameter>Grep tool instead:</｜DSML｜parameter>"
}
```

The JSON is valid, so the shell got all of it and tried to run it. Other times the markup broke the JSON itself, and LiteLLM's log said so:

```text
LiteLLM:WARNING: factory.py:6215 - Failed to parse tool call arguments for tool 'Bash'
(chat completions). Error: Unterminated string starting at: line 1 column 13 (char 12).
```

My coding agent, which uses the same model through the same gateway, had the leak in 7.3% of its calls.

The first sign of this wasn't an error message. My analysis script crashed while printing samples:

```text
UnicodeEncodeError: 'charmap' codec can't encode character '｜' in position 111
```

That character is `｜`, the fullwidth vertical bar DeepSeek uses in its special tokens, and Windows' default console encoding can't print it. The crash told me what to search for.

I also chased a false alarm. Error messages from failed calls showed commands like this:

```text
ls plans/ plans/completed/ 2›/dev/null && grep -n 'side rail' ...
```

That `›` is a look-alike bracket where `>` belonged, and it would break every shell redirect. I checked every call that had parsed, and none of them contained one. The `›` came from Claude Code's error message, which rewrites `>` when it quotes your input. One layer's way of displaying a problem had made it look like a different problem.

The cleanup callback in LiteLLM now cuts the markup out. It cuts only when DeepSeek's bar character is in the string, because an Edit that really contains a `</parameter>` tag should reach the file as written.

## DeepSeek's habits

Most of the 15.0% wasn't malformed calls. When I sorted the 181 errors by kind, these were the biggest:

| Kind | Errors |
|---|---|
| Refused by Claude Code's worktree guard | 29 |
| Path not found | 29 |
| Command ran and failed | 29 |
| DSML markup in the arguments | 28 |
| Arguments that weren't valid JSON | 15 |
| File too big for one Read | 11 |

The worktree refusals are the strangest. Each session works in its own git worktree, and Claude Code refuses commands it can't prove stay inside it:

```text
This session is isolated in the worktree <its folder>, but this command is too
complex to verify that it stays inside the worktree. Refusing to run it.
```

DeepSeek kept starting commands with `cd <its own worktree> && …`, changing into the folder it was already in, and Claude Code refused the whole command each time. Claude doesn't write commands like that, so the guard had never been a problem before. Neither side was broken. DeepSeek writes commands in a way Claude Code wasn't built to expect. A five-line note appended to the system prompt now tells it not to `cd`, to use relative paths and to run one command per call.

## The loop

Then I gave it a real job, building a phase of one of my plans, and it got stuck. Its first task was to update a card on my kanban board with a description from the plan. It called the board's `update_task` tool about 25 times in a row. Each time it said what it was about to do, and each time a different call arrived:

```text
model:  I'm stuck in a loop of identical calls. Let me set the `description`
        parameter ...
call:   update_task {"id": "coding-agent#15",
                     "title": "Reference repos 1: /refs at the start of a job, from ref: labels",
                     "waits_on": ""}
result: Updated coding-agent#15: Reference repos 1: /refs at the start of a job, from ref: labels
```

No `description`, and "Updated" every time, because a call without a description is a valid update. Twice it also filled `waits_on` with a garbled copy of the parameter's own help text:

```json
{"waits_on": "\"\" clears. Omit to leave unchanged. Pass \"\" to clear. (string) — pass empty string to clear"}
```

It started a few minutes after I'd deployed the LiteLLM changes above, so I went after my own changes first, peeling from the outside in:

1. The system-prompt note? The same request with and without it dropped the description 12 times out of 12.
2. The new default temperature? Every temperature from 0.3 to 1.0 dropped it.
3. The cleanup callback? Its log and its metric were empty. It had never fired.
4. Then the test that settled it. I called Vertex through the LiteLLM library inside the container, which skips the gateway and everything I'd added to it. It still dropped the description.

Asking for a plain sentence showed where the text was going:

```text
asked:  set its description to: Phase 1 of the plan.
got:    {"id": "coding-agent#15", "title": "Phase 1 of the plan."}
```

With no `title` in the schema, the text didn't land anywhere. It just disappeared. So the problem was inside the two layers I don't control, Vertex's parsing and the model, and from outside I can't tell which of the two. Narrowing it down by parameter name gave a strange result:

| Parameter name | Kept |
|---|---|
| `notes`, `text`, `summary`, `note` | 3 of 3 |
| `description`, `body`, `content`, `details`, `comment` | 0 of 3 |

The same calls had worked the evening before. The last good one I can find was at 21:31 UTC. My deploy was at 00:38 and the loop at 00:42. The timing pointed at me, and it was wrong.

This one was harder to catch than any malformed call, because every call reported success. A malformed call gets an error, and the model tries something else. A call with an argument missing gets "Updated", and the model has nothing to correct.

## Working around it

I can't fix Vertex, but I can change what I hand it. Claude Code's Write tool takes a `content` argument, and in my tests it came through every time, even though a bare parameter called `content` didn't. So the prompt now tells the agent to skip the board's tools and go through its HTTP API, with the text in a file:

```bash
# 1. The Write tool saves the card's markdown to kanzo-description.md.
# 2. Python does the JSON escaping, which the model got wrong in 2 of 8 tries:
py -3 -c "import json; print(json.dumps({'description': open('kanzo-description.md', encoding='utf-8').read().strip()}))" > kanzo-body.json
# 3. curl sends it, and a GET reads it back to compare with the plan:
curl -s -X PATCH -H "Content-Type: application/json" --data-binary @kanzo-body.json "$BOARD/api/tasks/15"
curl -s "$BOARD/api/tasks/15"
```

In 8 tries, the text came through exactly every time. On the second run, with that change, the same model got past the board.

## What I'd tell someone stacking these tools

- Count your failures before you tune anything. Claude Code keeps every session as a transcript, and a short script that sorts tool errors by kind told me more than a week of watching sessions did.
- To find the layer at fault, go around it. Calling the next layer down directly and comparing the result answered questions that reading configs never did.
- Keep the experiments as small scripts you can rerun. The schema capture, the A/B tests and the parameter-name check were each a few dozen lines, and rerunning them after every change is how I knew a fix worked rather than guessing.
- Distrust timing. The loop began four minutes after my deploy and had nothing to do with it.
- Prefer a layer that fails loudly. A missing argument that reports success cost me more time than every malformed call put together.
- Delete what you don't need. Twelve unused tools were more than half of every request.

## Where it stands

Everything above is live: the tool cleanup, the prompt note, the temperature default and the markup cleanup. Right now I'm giving DeepSeek some fairly well-defined plans to build and working through the issues as they come up. I may go back to benchmarking and try other models behind the same alias, but it feels like the pieces are close to working together.

None of this is necessary, of course. Claude can do all of it already. But it's been a very good way to learn how much sits between a prompt and a model.

The rest of the setup is on the [Local AI stack](/projects/local-ai-stack/) page.
