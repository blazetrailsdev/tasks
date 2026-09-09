---
title: "parity:api:extra:gate does not run the STALE or REDUNDANT @noRailsEquivalent checks that CI runs"
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

**The REDUNDANT check has the same shape and the same blind spot.** PR #7631
hit it from the opposite direction: `SchemaCache.read` was tagged `@internal`
plus a `@noRailsEquivalent CONVERGEABLE` receipt, `pnpm parity:api:extra:gate`
reported `OK (activerecord novel 174/174, total 606/606)`, and CI failed with

```text
extra-surface: 1 REDUNDANT @noRailsEquivalent tag(s) on names the scorer
already allows — the tag asserts a Rails counterpart is absent where one was
found, so it covers no extra surface. Delete the tag next to the code:
  - activerecord  connection-adapters/schema-cache.ts  read
```

`pnpm parity:api --extra` does not surface it either — the extra-surface
section does not render under that invocation at all, so only
`pnpm parity:api:extra --package <pkg>` prints it. Both checks live in
`scripts/api-compare/extra-surface.ts` and both are invisible to the gate, so
whichever remedy is chosen should cover the pair rather than the stale arm
alone.

(That PR's underlying deviation is tracked separately as
[[extractor-does-not-model-private-class-method]]: `read` had no valid JSDoc
shape at all, because the unbacked-internal rule demanded a receipt the
redundant check then rejected. It shipped as a real TS `private`.)

## Converged shape

Either fold the stale-tag check into `parity:api:extra:gate` so the documented
pre-PR command covers what CI runs, or add a `parity:api:extra:stale` script
and name it in CLAUDE.md's step 4 beside the ratchet. Folding is preferred —
one command, one contract, no third thing to remember.

## Acceptance criteria

- `pnpm parity:api:extra:gate` fails on a stale `@noRailsEquivalent` tag.
- `pnpm parity:api:extra:gate` fails on a redundant `@noRailsEquivalent` tag —
  one on a name the scorer already allows.
- A test covers the stale-tag and redundant-tag arms of the gate.
- CLAUDE.md's step 4 needs no new command, or names the new one.
