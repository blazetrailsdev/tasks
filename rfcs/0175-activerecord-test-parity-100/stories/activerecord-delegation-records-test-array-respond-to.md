---
title: "activerecord: DelegationRecordsTest is not ported — a JS array does not answer Ruby Array names to respond_to?"
status: claimed
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-13T12:42:25Z"
assignee: "activerecord-delegation-records-test-array-respond-to"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb:49-55`
defines `DelegationRecordsTest`, which includes `DelegationTests` (`:10-31`)
with `target` answering `Comment.all.records`, a Ruby `Array`. Each generated
case is `assert_respond_to target, method` over `ARRAY_DELEGATES` (`:11-26`).

trails ports the module as the `DelegationTests(target)` function in
`packages/activerecord/src/relation/delegation.test.ts`, called by
`DelegationAssociationTest` and `DelegationRelationTest`. `DelegationRecordsTest`
has no describe there, because `await Comment.all().records()` is a native JS
array and `assertRespondTo` (`packages/activesupport/src/testing/assertions.ts`,
`respondsTo`) answers an Array only by member lookup. 37 of the 46 names fail:
every one that is not already an `Array.prototype` member under its trails
spelling (`plus`, `difference`, `union`, `intersection`, `shuffle`, `isAll`,
`collect`, `compact`, `detect`, `eachCons`, `eachWithIndex`, `isExclude`,
`findAll`, `groupBy`, `isNone`, `isOne`, `partition`, `reject`, `rotate`,
`sample`, `second`, `sortBy`, `third`, `index`, `rindex`, `toArray`, `toSet`,
`toXml`, `toYaml`, `inGroups`, `inGroupsOf`, `toSentence`, `toFormattedS`,
`toFs`, `asJson`, `isIntersect`).

Strings already have the converged shape: `respondsTo` hands a String to
ruby-compat's `rbStrRespondTo`
(`packages/ruby-compat/src/string/method-table.ts`), which answers from the
table `rbStrSend` dispatches over. There is no Array counterpart.

The passing subset currently runs as TS-only tests in
`packages/activerecord/src/relation/delegation.trails.test.ts`
(`describe("ARRAY_DELEGATES on the DelegationRecordsTest target")`, with the
failing names listed in `RECORDS_ARRAY_GAPS`).

`parity:test` does not see the gap: the Ruby extractor emits a mixin module's
tests once with no class ancestor
(`ruby-extractor-emits-mixin-tests-per-includer`, RFC 0025), so the file reads
48/49 with the third includer absent.

## Acceptance criteria

- [ ] `respond_to?` on an Array answers the Ruby `Array` / `Enumerable` /
      ActiveSupport core-ext names trails ports, through a ruby-compat Array
      method table that `assertRespondTo` consults as it consults
      `rbStrRespondTo` for a String.
- [ ] `delegation.test.ts` gains `describe("DelegationRecordsTest")` calling
      `DelegationTests` with the loaded `Comment.all().records()`, none skipped
      beyond the `to_yaml` case the other two includers already park.
- [ ] The `ARRAY_DELEGATES on the DelegationRecordsTest target` describe and
      `RECORDS_ARRAY_GAPS` are deleted from `delegation.trails.test.ts`.

## Verification

```bash
pnpm vitest run packages/activerecord/src/relation/delegation.test.ts
pnpm parity:test --package activerecord --missing
```
