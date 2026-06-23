---
title: "canonical-company-enable-sti"
status: claimed
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-23T11:07:38Z"
assignee: "canonical-company-enable-sti"
blocked-by: null
---

## Context

`eager association loading with cascaded three levels by ping pong` in
`packages/activerecord/src/associations/cascaded-eager-loading.test.ts` is
`it.skip` because `Firm.all` returns all 12 companies — the canonical
`test-helpers/models/company.ts` never calls `enableSti(Company)`, so STI type
scoping (`WHERE type IN (...)`) is absent.

`enableSti(Company)` fixes the scoping AND makes the ping-pong test pass, BUT it
regresses unrelated Company importers: with STI active, `new Company({})`
aggregates subclass-declared virtual attributes (e.g. `LargeClient#extra_size`)
into the STI base via shared schema-cache warming. That breaks
`PersistenceTest > becomes initializes missing attributes`
(`company.becomes(LargeClient)` → `extra_size` is null, not 50) because the
base's `@attributes` already carries `extra_size`, so `becomes`'
`reverse_merge!` keeps the base null instead of the subclass default. This is the
known schema-cache-warming attribute-aggregation deviation
(project_schema_cache_warming_converges_partial_decl). Rails STI bases do NOT
carry subclass `attribute()` declarations.

## Acceptance criteria

- [ ] Converge the schema-cache-warming attribute aggregation so an STI base does
      not inherit subclass-only `attribute()` declarations (or otherwise make
      `becomes` Rails-faithful under STI).
- [ ] `enableSti(Company)` on the canonical model without regressing
      `becomes`/persistence/any other Company importer.
- [ ] Un-skip `eager association loading with cascaded three levels by ping pong`.
