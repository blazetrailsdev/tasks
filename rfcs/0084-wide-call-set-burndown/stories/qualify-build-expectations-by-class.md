---
title: "Key parity:api:build expectations by class, not bare identifier"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6372
claim: "2026-08-11T18:05:53Z"
assignee: "burndown-annotate-verified-equivalents"
blocked-by: null
closed-reason: null
---

## Context

`parity:api:build` keys its expectations by bare identifier per file, mirroring
`compare.ts`'s `tsCallsByFileName`, so two same-named declarations in one file
share ONE expected-call set. The limitation is documented in
`scripts/api-compare/build.ts` (`reconcileFileText`, the "KNOWN LIMITATION"
comment) with "qualify by class if this ever bites".

It bit, in PR #6364. Migrating the `Mutex#synchronize` rows for
`ConnectionPool#checkout` / `#checkin` / `#remove` / `#disconnect` stamped the
same `@missingRailsCall` blocks onto `NullPool`'s same-named members in
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`.
Rails' `NullPool`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-42`)
takes no mutex at all and defines neither `checkout` nor `disconnect`, so those
four tags asserted a Rails call that the matched Ruby body never makes. Worse,
one of them suppressed the flag file-wide: removing the tag from
`ConnectionPool#checkout` alone left `NullPool#checkout`'s copy silently
suppressing it, which reds the retained baseline row as STALE and took a second
debugging pass to find.

The tags themselves are gone (#6364 suppressed `synchronize` via
`NO_JS_CALL_FORM` instead), but the misattribution mechanism is untouched and
will repeat on the verified-equivalents slice
(`burndown-annotate-verified-equivalents`), where `postgresql-adapter.ts` and
`attribute-methods.ts` both carry same-named members.

## Acceptance criteria

- Expectations are keyed by (class, name) rather than bare name, so a tag is
  minted only on the declaration whose Ruby counterpart actually makes the
  call. Top-level functions keep their current bare-name key.
- The suppression side agrees with the minting side: `compare.ts`'s
  `callTagKey` / `suppressTaggedCalls` must not let a tag on one class silence
  a flag raised against a sibling in the same file.
- Regression test: a fixture file with two same-named methods in different
  classes, where only one is the artifact's match, mints exactly one tag.
- The "KNOWN LIMITATION" comment in `reconcileFileText` goes away with the
  limitation.
