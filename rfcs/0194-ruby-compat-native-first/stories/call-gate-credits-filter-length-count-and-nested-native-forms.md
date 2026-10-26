---
title: "Call gates credit .filter(fn).length as count and native forms in nested arguments"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`native-analogues-array-calls` lists `count` with a block as `.filter(fn).length`, but `parity:api:calls` does not credit that form: converting `aryCount` at `relation/batches/batch-enumerator.ts` (`destroy_all`, `activerecord/lib/active_record/relation/batch_enumerator.rb`), `associations/has-many-through-association.ts` (`delete_records`) and `connection-adapters/abstract/connection-pool.ts` (`stat`, `connection_pool.rb`) reds the gate with a missing `count` row (trails#9347). The extractor's native-form switch (`scripts/api-compare/extract-ts-api.ts`, the `case "filter"` arm near `:7898`) credits only `compact`.

Separately, `parity:api:calls:args`'s naming gate cannot pair a native form passed as an argument (`compact(dbConfigs)` in `database-configurations.ts` `buildConfigs`, `toI(year)` in chronic `ordinal.ts` / `scalar.ts`, `toI(fetch(ENV, ...))` in `message-pack/serializer.ts`, `compact(sgids.map(...))` in globalid `locateManySigned`, `toI(this.span)` in fugit `toDebugS`). `.filter((x) => x != null)` over `this._logged.get(level)!` (`MockLogger#logged`, `activesupport/lib/active_support/log_subscriber/test_helper.rb:75`) is also not credited as `compact`. Each of these keeps the helper behind an `eslint-disable-next-line blazetrails/ruby-compat-native-required` line.

## Acceptance criteria

- [ ] `.filter(fn).length` on a proven array is credited as `count` with a block; `aryCount` joins `eslint/ruby-compat-native-required.json`; the three boolean-block sites above convert (`activejob/src/enqueuing.ts`'s `isSuccessfullyEnqueued(): unknown` site keeps the helper).
- [ ] A native form nested as a call argument pairs with Ruby's call by its Ruby name in the call-args naming gate, and `filter` over a non-null-asserted receiver is credited as `compact`.
- [ ] The seven disable lines naming a gate are removed and those sites converted.
