---
title: "Call gate: credit .length for empty?/size/length on a Ripper-proven String or Hash receiver"
status: done
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9252
claim: "2026-10-22T21:01:45Z"
assignee: "call-args-drops-visibility-boolean-argument"
blocked-by: null
---

## Context

`significantCallsForReceivers` drops `empty?` / `size` / `length` from
significance only when every Ruby site is a proven `array`
(`scripts/api-compare/compare.ts:782`, `:808-809`). A proven `string` or
`hash` still needs a call, so a port writes `isEmpty(s)`. The helper's JSDoc
says it exists only for this credit
(`packages/ruby-compat/src/ruby-empty.ts:24-26`). The Relation homonym that
the guard at `compare.ts:333-343` protects against only shows up under
`local` / `ivar` / `expr` kinds.

## Acceptance criteria

- [ ] `empty?` / `size` / `length` are credited when every site's kind is `array`, `string` or `hash`. `first` / `last` stay array-only.
- [ ] Tests in `compare.test.ts` cover a string and a hash credit, plus a `local` that stays flagged.
- [ ] `pnpm parity:api:calls` is green. Any row that goes stale is deleted by hand and tightened.
