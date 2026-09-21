---
title: "Relocate TS-only extras out of postgresql bit-string.test.ts"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7935
claim: "2026-09-21T17:54:07Z"
assignee: "assertions-activesupport-cache-xml-json-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/bit-string.test.ts` mirrors
`vendor/rails/activerecord/test/cases/adapters/postgresql/bit_string_test.rb` (6/6 matched after trails#7924),
but still carries four TS-only tests with no Rails counterpart: `bit string type cast`,
`bit string invalid`, `varbit string`, `varbit string default`. They use raw SQL through the adapter
and show up as parity:test extras. `bit string type cast` also calls `Bit#cast`, which does not typecheck
(TS2339 "Property 'cast' does not exist on type 'Bit'").

## Acceptance criteria

- Move the four extras into `adapters/postgresql/bit-string.trails.test.ts` (or delete any that duplicate a Rails test's coverage: `varbit string default` overlaps `test_default`).
- The type-cast test typechecks, via `castValue` / `deserialize` as `oid/bit.ts` exposes, matching `connection_adapters/postgresql/oid/bit.rb`.
- `bit-string.test.ts` has 0 TS-only extras in parity:test.
