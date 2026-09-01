---
title: "parity:api:extra:gate does not run the STALE @noRailsEquivalent check that CI runs"
status: draft
updated: 2026-08-31
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra:gate` is the gate CLAUDE.md tells you to run before
opening a PR that adds a public name. It runs
`scripts/api-compare/lint-extra-surface-ratchet.ts`, which checks only the
`novel`/`total` marks in `extra-surface-mark.json`.

The **STALE `@noRailsEquivalent` tag check lives elsewhere** — in
`scripts/api-compare/extra-surface.ts`, which the `rails-comparison` CI job
runs as its own step. So a PR can have every documented gate green locally and
still red CI on a tag it added.

That is exactly what happened on PR #7295: `parity:api:extra:gate` was green
across four rounds, and CI failed with

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) on methods that no longer flag
as extra surface ...
  - trailties  generators/app-generator.ts  pmRun
```

The tag was on a TS `private` method, which is never counted as extra surface
(a real `private` confers internal unconditionally, RFC 0121), so the receipt
backed nothing. Nothing local told the author that.

Note the existing sibling story `parity-api-extra-does-not-run-stale-tag-gate`
in this author's memory refers to `parity:api --extra`; this is about the
`parity:api:extra:gate` script CLAUDE.md actually names.

## Converged shape

Either fold the stale-tag check into `parity:api:extra:gate` so the documented
pre-PR command covers what CI runs, or add a `parity:api:extra:stale` script
and name it in CLAUDE.md's step 4 beside the ratchet. Folding is preferred —
one command, one contract, no third thing to remember.

## Acceptance criteria

- `pnpm parity:api:extra:gate` fails on a stale `@noRailsEquivalent` tag.
- A test covers the stale-tag arm of the gate.
- CLAUDE.md's step 4 needs no new command, or names the new one.
