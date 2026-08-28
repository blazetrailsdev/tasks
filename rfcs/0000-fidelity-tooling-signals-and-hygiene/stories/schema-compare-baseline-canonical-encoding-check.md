---
title: "Guard schema-compare's invented-baseline against the same non-ASCII churn trap"
status: ready
updated: 2026-07-30
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5429 fixed the api-compare baseline churn trap: `scripts/api-compare/baseline-json.ts`
now pins one canonical on-disk form (2-space indent, trailing newline, non-ASCII
literal), the wide/narrow/body-pins writers route through it, and
`baseline-json.test.ts` asserts every committed api-compare baseline matches.

`scripts/schema-compare/invented-baseline.json` is deliberately outside that set:
`compare.ts --write` writes it through `writeJsonManifest`
(`scripts/api-compare/write-json-manifest.ts`), so prettier — not
`JSON.stringify` — owns its bytes, and prettier collapses short arrays onto one
line. It is canonical for prettier today and has no escaped non-ASCII, so there
is no live churn. But nothing checks it: a hand-edit that introduces a `\uXXXX`
escape (or any other prettier-unstable formatting prettier itself would not
rewrite) would re-arm the same trap in that file, and the next `--write` would
churn it silently.

## Acceptance criteria

- A check covers `scripts/schema-compare/invented-baseline.json` in the same
  spirit as `findNonCanonicalBaselines`, expressed against the prettier-owned
  form rather than the `JSON.stringify` one (compare bytes against
  `writeJsonManifest`'s output for the parsed contents, or assert simply that
  the file contains no `\uXXXX` escape for a character prettier writes
  literally).
- The check runs in a plain `vitest` run, like the api-compare test, so it does
  not depend on a schema-compare artifact existing.
- Note in `write-json-manifest.ts` (or `baseline-json.ts`) that the repo has TWO
  canonical JSON forms on purpose and which files belong to each — today a
  reader has to infer it from which writer a file goes through.

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/api-compare/write-json-manifest.ts` -> `scripts/parity/write-json-manifest.ts`

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
