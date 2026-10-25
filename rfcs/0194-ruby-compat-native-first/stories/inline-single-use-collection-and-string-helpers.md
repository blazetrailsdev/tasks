---
title: "Inline the single-use ruby-compat collection and string helpers at their one caller"
status: claimed
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-25T00:50:39Z"
assignee: "rescue-from-ports-respond-to-case-equals"
blocked-by: null
closed-reason: null
---

## Context

The triage in `triage-ruby-compat-exports-with-no-external-importer` found
these single-importer exports with a native JS form or a body small enough to
inline at their one caller. No `inline-single-use-*` story covers them:

- `insert` (`array.ts`) in `actionpack/src/action-dispatch/middleware/stack.ts`
- `min` (`comparable.ts`) in `activerecord/src/relation.ts`
- `tally`, `reduce` (`enumerable.ts`) in `activejob/src/log-subscriber.ts`,
  `activerecord/src/associations/preloader/through-association.ts`
- `transformValuesBang` (`hash.ts`) in `activesupport/src/hash-with-indifferent-access.ts`
- `upcase` (`string/case-mapping.ts`) in `rack/src/method-override.ts`
- `deleteSuffix`, `rbStrInclude` (`string/method-table.ts`) in
  `activejob/src/queue-adapter.ts`, `marcel/src/magic.ts`
- `rbStrSub`, `rbStrRpartition` (`string/sub.ts`) in `rack/src/sendfile.ts`,
  `rack-session/src/cookie.ts`
- `printf` (`io.ts`) in `trailties/src/thor/shell/column-printer.ts`

## Acceptance criteria

- [ ] Each caller uses the native form where the receiver is a plain array or
      string (`splice`, `toUpperCase`, `endsWith`, `includes`, `replace`,
      `lastIndexOf`), or the subset of the body it reaches.
- [ ] An export is deleted unless a ruby-compat internal (`string/method-table.ts`,
      `range.ts`) still uses it, in which case it stays unexported.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` are green with no new
      baseline row; `pnpm parity:api:extra:gate` is green.
