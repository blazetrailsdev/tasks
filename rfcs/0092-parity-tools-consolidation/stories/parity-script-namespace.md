---
title: "Introduce parity:* package.json namespace for the compare tools"
status: done
updated: 2026-08-08
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: ["extract-parity-tools-package", "relocate-parity-pipeline"]
deps-rfc: []
est-loc: 120
priority: null
pr: 6260
claim: "2026-08-08T20:17:12Z"
assignee: "parity-script-namespace"
blocked-by: null
closed-reason: null
---

## Context

The root `package.json` mixes namespaces: `test:*` covers both vitest runners
(`test:watch`, `test:db`, `test:types`) and the compare tooling under the same
prefix; api-compare has its own `api:*`
namespace; fixtures-compare and schema-compare have no scripts at all (CI
invokes `scripts/fixtures-compare/compare.ts` and
`scripts/schema-compare/compare.ts` by path).

Introduce a `parity:*` namespace for the compare tools (consistent with
`@blazetrails/parity` being the tooling core): `parity:api` and `parity:test`
replacing the two legacy compare entry points, new `parity:fixtures` /
`parity:schema` wrapping the path-invoked entry points; sub-commands keep
shape (`parity:api:calls`, `parity:test:assertions`, ...). `parity:schema`
is _repurposed_: the pipeline-relocation story already moved the old meaning
to `parity:pipeline:schema` — this story depends on that landing first.

Keep every existing legacy name as a delegating alias — CLAUDE.md,
CONTRIBUTING, docs, btwhooks task prompts, and agent memory all reference the
old spellings. Alias removal plus the reference sweep
is a separate follow-up story once nothing depends on the old names.

## Acceptance criteria

- `parity:*` scripts exist for all four compare tools and their
  sub-commands; old names still work as aliases.
- CI workflows switched to the new names where they used `pnpm` scripts
  (path invocations may switch to `pnpm parity:fixtures` / `parity:schema`).
- CLAUDE.md updated only where the new name becomes canonical.
