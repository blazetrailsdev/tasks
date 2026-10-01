---
title: "globalid: Locator.locate / locate_many / find_records never read :includes"
status: draft
updated: 2026-10-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/output/options-key-mismatches.json` lists three globalid pairs whose TS options type
has no `includes` key that the Ruby body reads (`missingInTs: ["includes"]`): `locate`, `locate_many`
and `find_records`.

In the gem (`vendor/globalid/v1.3.0/lib/global_id/locator.rb`):

- `:163` — `model_class = model_class.includes(options[:includes]) if options[:includes]` (single locate)
- `:179` — `find_records(model, ids, ignore_missing: options[:ignore_missing], includes: options[:includes])`
- `:193` — `model_class = model_class.includes(options[:includes]) if options[:includes]` (`find_records`)

`packages/globalid/src/locator.ts` does not mention `includes` at all, so a caller's `includes:` is dropped
and the located records are not eager-loaded.

## Converged shape

Each of the three bodies reads `options.includes` and applies `modelClass.includes(options.includes)` at the
line the gem does, and `locate_many` forwards it to `findRecords`.

## Acceptance criteria

- [ ] `locate`, `locateMany` and `findRecords` accept and apply `includes`, at the gem's call sites.
- [ ] The gem's `:includes` tests are ported with their names verbatim.
- [ ] `options-key-mismatches.json` lists no globalid pair with `missingInTs`.
