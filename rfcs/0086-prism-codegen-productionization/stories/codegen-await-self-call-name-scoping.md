---
title: "Scope self-call await decisions to the generated file's own Rails defs"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5829
claim: "2026-08-01T21:31:00Z"
assignee: "codegen-await-self-call-name-scoping"
blocked-by: null
closed-reason: null
---

## Context

PR #5822 made await insertion receiver-aware: `shouldAwaitCall`
(`scripts/prism-codegen/await-policy.ts`) now awaits only when the call has no
receiver (implicit self-call) or an explicit `self.` receiver. That removed 64
bogus awaits on locals, params, ivars, constants and call chains.

The remaining imprecision is on the eligible side. For a self-call the decision
is still taken on the bare callee name: `crossFileAsyncNames`
(`scripts/prism-codegen/async-source.ts`) awaits a name when exactly one port
file defines it async and Rails `def`s it _somewhere_ in `TARGET_FILES` — not
necessarily in the file being generated, nor in that file's ancestry. Two
different Rails methods that share a name across different Rails files are
therefore indistinguishable, and the async one drags an await onto the sync
one's self-call.

Blast radius is still latent (generated output is not executed yet) but becomes
behavioural under `codegen-apply-scaffolding`.

## Acceptance criteria

- A self-call's await decision is scoped to definitions reachable from the file
  being generated (its own Rails file plus its include/extend ancestry), not
  the whole `TARGET_FILES` corpus.
- A name that is async in one Rails file and sync in another no longer awaits
  the sync file's self-call; a test covers exactly that pair.
- `pnpm codegen:score` matched count does not regress; goldens regenerated and
  the diff reviewed to confirm every dropped await is a cross-file name clash.
