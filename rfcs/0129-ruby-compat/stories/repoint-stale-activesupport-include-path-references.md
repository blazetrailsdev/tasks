---
title: "Repoint the five stale activesupport/src/include.ts path references at ruby-compat"
status: done
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 27
pr: 7501
claim: "2026-09-04T23:26:00Z"
assignee: "io-write-must-transcode-to-utf8-in-text-mode"
blocked-by: null
closed-reason: null
---

## Context

PR #7424 deleted `packages/activesupport/src/{include,prepend}.ts`, and #7466
renamed the mixin hook `Symbol.for` keys to the `@blazetrails/ruby-compat:`
namespace and swept the two docs that taught the old key
(`CLAUDE.md:551-552`, `packages/website/docs/guides/index.md:107,117`).

Four references to the deleted path survive, all describing `include()` /
`Included<>` rather than the hook keys, which is why they were left out of PR
7466's scope:

- `scripts/api-compare/extract-ts-api.ts:867` — `// mixin uses (see activesupport/src/include.ts).`
- `scripts/api-compare/extract-ts-api.ts:2552` — "(`packages/activesupport/src/include.ts`) — the single declaration site for a …"
- `scripts/parity/conventions.ts:859` — `"(packages/activesupport/src/include.ts) copies prototype members and "`
- `docs/ruby-ts-conventions.md:208` — the same sentence, GENERATED from the
  `conventions.ts` string above; fix the source, regenerate the doc, never
  hand-edit it (CLAUDE.md § Working in this repo).

Also `CLAUDE.md:537` still points at `activesupport/src/include.ts` for
`include()` / `Included<>`; the real declaration site is
`packages/ruby-compat/src/include.ts`.

Each one now names a file that does not exist, so a reader following it finds
nothing — and the `conventions.ts` one is load-bearing prose that
`parity:api`'s own documentation reproduces.

## Converged shape

Repoint all five at `packages/ruby-compat/src/include.ts`, then regenerate
`docs/ruby-ts-conventions.md` from `scripts/parity/conventions.ts` rather than
editing it. No behavior change; `pnpm parity:api` must show the doc
regenerated and no delta.

## Acceptance criteria

- `git grep 'activesupport/src/include.ts'` returns nothing.
- `docs/ruby-ts-conventions.md` is regenerated, not hand-edited, and its CI
  currency check stays green.
- `pnpm parity:api` / `parity:api:calls` deltas non-negative.
