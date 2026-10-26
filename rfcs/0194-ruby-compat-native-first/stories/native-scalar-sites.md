---
title: "Native Math / Number / trim forms for toI / toF / round / isNan / max / min / strip / chomp / strlen where the value set makes them identical"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: native-sweep
packages:
  ["actionpack", "actionview", "activemodel", "activejob", "activerecord", "rack", "trailties"]
deps: ["native-analogues-hash-and-scalar-calls", "ruby-compat-native-required-lint"]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9347
claim: "2026-10-26T18:48:09Z"
assignee: "native-array-set-op-sites"
blocked-by: null
closed-reason: null
---

## Context

These numeric and string helpers have importing non-test files outside
ruby-compat: `toI` 17 (`action-dispatch/middleware/ssl.ts`,
`activemodel/src/type/date-time.ts`, `activejob/src/core.ts`,
`action-dispatch/http/url.ts`, …), `toF` 3, `round` 2
(`action-dispatch/log-subscriber.ts`, `actionview/src/log-subscriber.ts`),
`isNan` 1 (`activemodel/src/type/float.ts`), `max` 3 / `min` 1
(`timestamp.ts`, `relation.ts`, `type/adapter-specific-registry.ts`), `strip`
2, `rstrip` 1, `chomp` 3 (`helpers/text-helper.ts`,
`middleware/static.ts`, `rack/src/show-exceptions.ts`), and `strlen` 1
(`thor/shell/wrapped-printer.ts`).

Several differ from the obvious JS form. `String#to_i` parses a leading
integer and answers 0 (`Number.parseInt` answers `NaN`). `Float#round` rounds
half away from zero (`Math.round` rounds half up). `strip` also removes `\0`.
`chomp` with no argument removes `\r\n`, `\n` or `\r`. `strlen` counts
codepoints.

## Acceptance criteria

- [ ] A site is converted only where the receiver's value set makes the JS form identical: an integer `toI`, `round` on a non-negative value, `trim` on input that cannot carry `\0`, `max` / `min` over numbers as `Math.max(...xs)` with the empty case answering `null`. Every other site keeps the helper and is listed in the PR with the difference that applies.
- [ ] Converted helpers join `eslint/ruby-compat-native-required.json`, and any export left with no caller is deleted.
- [ ] The comparable helpers with no importer outside ruby-compat (`equals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `cmpint`) are left to `triage-ruby-compat-exports-with-no-external-importer`.
- [ ] Call gates green, no new baseline rows.
