---
title: "tasks: list --json is cut off at 64 KiB when piped"
status: draft
updated: 2026-10-05
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
closed-reason: null
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
