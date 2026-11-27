# Plans

Each plan is one file, `<topic>-plan.md`, in the folder for where it stands:

| Folder | Holds |
|---|---|
| [not-started](not-started) | Written, but no work has begun |
| [in-progress](in-progress) | Being built, with unticked items in its **Progress** checklist |
| [completed](completed) | Done: every Progress item ticked, or the plan closed |

When a plan's status changes, `git mv` it to the new folder and update the links to it. This is the same layout as oscar, spiff and penguin. Nothing in this folder is published on the site.
