---
title: "collectCalls records _private()/Klass() names the Ruby extractor drops"
status: closed
updated: 2026-08-15
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded: RFC 0084 is retired in favour of RFC 0106 (wide call-set direct burndown). Re-filed verbatim, with its blocker intact, as 0106/align-collect-calls-filter-with-ruby-extractor. Work it there."
---

## Context

`callSiteName` (`scripts/api-compare/extract-ts-api.ts`, added by #6304) now
applies the Ruby extractor's own name filter — `extract-ruby-api.rb`'s
`call_site_name` drops a name starting with `_` or with anything other than a
lowercase letter — so the `callArgs` stream cannot manufacture TS-only sites.

`collectCalls`, feeding `calls` / `callSeq`, does NOT apply it: it records
`this._privateHelper()` and `Klass(...)` as call names. Ruby never emits those,
so every such name is an unpairable TS-only entry in the call set. Left
unaligned in #6304 because changing it moves the `parity:api:calls` population, which
needs its own measured PR.

Reference: `extract-ruby-api.rb#call_site_name` (the `!name.start_with?("_") &&
name =~ /\A[a-z]/` guard, shared with `walk_for_calls`), against
`collectCalls`'s identifier / property-access / super branches.

Note this is the reverse direction of the usual concern: the filter REMOVES
names, so it can only delete call-set entries. Verify it does not silently drop
a name that was legitimately pairing — a Ruby method genuinely named with a
leading underscore is dropped on the Ruby side too, so the pair was already
impossible.

## Acceptance criteria

1. `collectCalls` applies the same name filter as `callSiteName`, citing the
   Ruby guard.
2. The `parity:api:calls` artifact is regenerated and the row movement reported; stale
   baseline rows for now-dropped names are deleted by hand (only-shrink — no
   `--write` reseed).
3. Tests pin that `this._helper()` and `Klass()` are not credited, while
   `constructor` and `super` still are.
