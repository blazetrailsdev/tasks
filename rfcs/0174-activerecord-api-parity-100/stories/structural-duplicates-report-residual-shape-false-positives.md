---
title: "structural-duplicates-report-residual-shape-false-positives"
status: draft
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After `activerecord-triage-structural-duplicates-of-ruby-compat`, `pnpm parity:structural-duplicates:report`
(`scripts/api-compare/report-structural-duplicates.ts`) still lists 9 activerecord candidates, all shape-only
false positives. Each comes from a token the shape erases, not from a copy of Ruby core semantics:

- **Constant receivers are erased by the extractor.** `extract-ts-api.ts:4798` drops a `const:` receiver from
  `callArgs[].recv`, so `Promise.resolve()` (`schema-dumper.ts:271,276,281,286` — `extensions` / `types` /
  `schemas` / `virtualTables`, Rails' empty hooks at `vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb`)
  shapes as `ref:resolve|`, the same as ruby-compat's module-private `resolve()` behind `getAsyncContext`,
  `getCrypto`, `getOs`, `getZlib`, `getChildProcess` and their `*Async` twins (9 exports x 4 sites).
- **`ref:get` covers both `Map#get` and index access.** `store.ts:59 localStoredAttributes`
  (`_storedAttributes.get(this)`) matches `array.ts:417 first` (`ary[0]`).
- **Operators and template literals are erased.** `abstract-adapter.ts:1738 isRetryableConnectionError`
  (`if (a && !b) return true`) matches `verbose.ts:25 setVerbose` (`a && b ? true : v`) as `if,and|`;
  `abstract-adapter.ts:833 validateDefaultTimezone` and `query-logs.ts:91 tagsFormatter` (a `switch` raising
  `ArgumentError` with a Rails message) match `string/support.ts:101 rbErrorArity` as
  `if,if,throw:ArgumentError,new:ArgumentError|`, because the message is a template (`?`).
- **Get-or-set memo.** `fixtures.ts:155 contextClass` (Rails `@context_class ||= Class.new`,
  `fixtures.rb`) matches `object.ts:467 rbObjId` as `ref:get,if,ref:set|`.

The extractor's `recv` / skeleton are shared with the call-argument gate (`lint-call-args.ts`), so a fix there
must not move `call-mismatches-exclude/` rows; a report-local fix (e.g. keeping a constant receiver only in
`shapeOf`, which needs it carried through the artifact) is preferred.

## Acceptance criteria

- [ ] Each of the four classes above is separated by the shape, with a test in
      `report-structural-duplicates.test.ts` that fails on the current shape.
- [ ] `regexpEscape`'s real-duplicate match (the RFC 0129 signal) is still reported.
- [ ] The report lists no activerecord candidate, and `pnpm parity:api:calls:args` is unchanged.
