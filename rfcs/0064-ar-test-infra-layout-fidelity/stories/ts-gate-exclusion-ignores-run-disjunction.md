---
title: "ts-gate-exclusion-ignores-run-disjunction"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5605
claim: "2026-07-29T21:30:01Z"
assignee: "ts-gate-exclusion-ignores-run-disjunction"
blocked-by: null
closed-reason: null
---

## Context

`gateFromGuardExpr` (`scripts/test-compare/gates.ts:196-213`) drops a positive
adapter set when a feature rides along on a disjunctive run condition, but
leaves an adapter EXCLUSION alone in the same situation. PR 5602 scoped the
disjunction check to the positive case on purpose; this story covers the
exclusion.

`packages/activerecord/src/migration/foreign-key.test.ts:1130` is the live
example:

```ts
it.skipIf(adapterType === "mysql" && !supportsRenameIndex)("rename reference column of child table", ...)
```

The run condition is `!mysql || supportsRenameIndex` — a disjunction. The
extractor emits `adapters=[postgresql,sqlite] features=[foreign_keys]`, i.e. it
claims the test never runs on MySQL, when in fact it runs on MySQL wherever
`supports_rename_index?` holds.

The Rails side is imprecise in the same direction but for a different reason.
`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:96`:

```ruby
if current_adapter?(:Mysql2Adapter, :TrilogyAdapter) && !@connection.send(:supports_rename_index?)
  skip "Cannot drop index, needed in a foreign key constraint"
end
```

`scan_run_condition` matches `supports_X?` via `call_ident_name`, which does not
see through `send(:supports_rename_index?)` — so Ruby records no feature at all,
`has_or` stays false, and it emits the bare exclusion `[postgresql,sqlite]`.
The two sides agree today only because both are wrong the same way; tightening
either one alone opens a `wrong-gate`.

## Acceptance criteria

- Decide and implement one coherent rule for an adapter exclusion under a
  disjunctive run condition, applied to BOTH extractors so they stay in
  lockstep — either drop the exclusion (and let the affected tests carry a
  feature-only gate) or teach `scan_run_condition` to see `send(:supports_X?)`
  so the Ruby side records the feature and `mixed` handles it.
- `pnpm test:compare --gates` gate-mismatch count does not rise; diff the
  `--gates` output before and after.
- Unit coverage in `scripts/test-compare/extract-ts-gates.test.ts` for the
  exclusion-under-disjunction case, replacing the pin PR 5602 left at
  "drops the adapter set when the RUN condition is a disjunction".
- If `send(:supports_X?)` becomes visible to the Ruby extractor, audit the other
  `send(:supports_` call sites in `vendor/rails/activerecord/test/` for gates
  that shift.
