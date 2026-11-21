---
title: "pg-gem-specs-type-and-type-map-files"
status: done
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10467
claim: "2026-11-21T00:56:32Z"
assignee: "activerecord-root-imports-without-pg-is-pinned"
blocked-by: null
closed-reason: null
---

## Context

`pg-gem-specs-enroll-in-parity-test` enrolled `pg` in `parity:test`: `rubyToConventionTs`
(`scripts/test-compare/compare.ts`) now maps `pg` specs onto `packages/pg/test/<x>.test.ts`, the 13
spec files for unported gem surface are `testFile` rows in `scripts/parity/unported-files/pg.ts`,
and `connection_spec.rb`, `result_spec.rb` and `exceptions_spec.rb` are fully accounted for (ported
examples in `packages/pg/test/connection.test.ts` / `result.test.ts`, the rest per-test rows with
the rule-1 reason "not called by activerecord").

Three spec files are still unaccounted for:

- `vendor/pg/v1.5.9/spec/pg/type_spec.rb` — 17 of 166 examples ported (`packages/pg/test/type.test.ts`,
  the Array coder examples); 149 missing.
- `vendor/pg/v1.5.9/spec/pg/type_map_by_oid_spec.rb` — 16 missing (`packages/pg/lib/type-map-by-oid.ts`).
- `vendor/pg/v1.5.9/spec/pg/type_map_by_class_spec.rb` — 13 missing (`packages/pg/lib/type-map-by-class.ts`).

## Acceptance criteria

- [ ] Every example of the three files that exercises a member in `packages/pg/README.md`'s surface
      table (the text decoders/encoders, `TypeMapByOid`, `TypeMapByClass`) is ported under its
      RSpec name into `packages/pg/test/{type,type-map-by-oid,type-map-by-class}.test.ts`.
- [ ] Every other example is a per-test row in `scripts/parity/unported-files/pg.ts` with the
      `NOT_CALLED` reason.
- [ ] `pnpm parity:test --package pg` shows no missing examples for these files.
