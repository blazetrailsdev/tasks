---
title: "Enroll marcel in parity:api and parity:test at 100%"
status: in-progress
updated: 2026-10-21
rfc: "0201-marcel-port-to-100"
cluster: marcel-parity
packages: ["marcel"]
deps: ["marcel-typecheck-clean"]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9198
claim: "2026-10-21T22:32:19Z"
assignee: "marcel-parity-enrollment"
blocked-by: null
---

## Context

`vendor/sources.ts` registers marcel (v1.0.4, `libPath: "lib/marcel"`,
`libEntryFile: "lib/marcel.rb"`) with `compareApi: false` and
`compareTests: false`, so no parity gate measures it. Enrolling it runs the
name, arity, parameter-name, call-set, call-argument, predicate and
extra-surface checks over a package that was generated, not hand-written:
expect rows from generator naming (`namespaces.ts`'s seat object, `tables.ts`'s
constants) and from test names the generator spelled.

## Acceptance criteria

- `compareApi` and `compareTests` are true for marcel.
- `parity:api` and `parity:test` report marcel at 100%.
- `parity:api:calls`, `parity:api:calls:args`, `parity:api:params`,
  `parity:api:predicates` and `parity:api:extra` are green for marcel with
  no new baseline rows; any receipt follows CLAUDE.md's two shapes.
