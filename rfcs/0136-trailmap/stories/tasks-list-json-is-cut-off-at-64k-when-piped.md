---
title: "tasks: list --json is cut off at 64 KiB when piped"
status: closed
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of tasks-cli-json-truncates-through-a-pipe, which carries the root cause (tasks src/cli.ts:509 process.exit() with stdout still buffered) and the fix shape. The defect is still live, reproduced 2026-10-12: 'tasks list --rfc 0136-trailmap --json' through a pipe stops at 65,536 bytes while the same command to a file writes 99,110, so the surviving story stays open."
---

## Context

`pnpm tasks list --rfc 0136-trailmap --json | node ...` fails to parse: the output stops at 65,508
bytes, mid-document. A reviewer hit the same thing on trailmap#32 ("`pnpm tasks list --json` output
did not parse (jq error at EOF)") and reviewed without the story as a result. 64 KiB is the pipe
buffer: the CLI exits before stdout has drained when stdout is a pipe and the document is larger
than one buffer. To a terminal or a file it is complete.

Filed here because the CLI is moving into trailmap (`move-the-tasks-cli-into-trailmap`); fix it
wherever the CLI lives when this is picked up.

## Acceptance criteria

- [ ] `pnpm -s tasks list --json | wc -c` and `pnpm -s tasks list --json > f; wc -c f` agree, for output over 64 KiB.
- [ ] No verb calls `process.exit` (or the adapter's `exit`) with output still buffered.
