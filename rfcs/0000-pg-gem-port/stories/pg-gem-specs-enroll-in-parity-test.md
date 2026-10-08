---
title: "pg: port the gem's specs for the wrapped methods and enroll the package in parity:test"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: package
packages: ["pg", "scripts"]
deps:
  [
    "pg-connection-session-setters-move-to-the-package",
    "pg-type-maps-and-text-decoders-move-to-the-package",
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/pg/v1.5.9/spec/pg/` holds `connection_spec.rb`, `result_spec.rb`, `exceptions_spec.rb`,
`type_map_by_oid_spec.rb`, `type_map_by_class_spec.rb`, `type_spec.rb` and 13 files for surface
trails does not port. Earlier stories in this RFC port individual examples beside the code; this
one enrolls the package so the match is measured.

Gated on RFC 0000-pg-gem-port open question 6. If the answer is "skip `parity:test`", close this
story with that reason.

## Acceptance criteria

- [ ] `scripts/test-compare/` enrolls `pg` (the four registrations: `compare.ts`, `extract-ts-tests.ts`, `generate-stubs.ts`, and the mark row by hand); every RSpec matcher the six spec files use is in `assertion-kinds.ts`.
- [ ] The 13 spec files for unported surface are `unported-files` rows with the rule-1 reason; within the six ported files, an example for an unported method is a skip with the same reason, not a stub.
- [ ] Examples for the 44 methods are ported under their RSpec names into `packages/pg/src/*.test.ts`; TS-only extras live in `*.trails.test.ts`.
- [ ] The specs run on the PG CI lane; `scripts/ci-suite-coverage.test.ts` is green.
- [ ] `pnpm parity:test` delta for every other package is zero.

## Verification

```bash
pnpm parity:test && pnpm parity:test:assertions
```
