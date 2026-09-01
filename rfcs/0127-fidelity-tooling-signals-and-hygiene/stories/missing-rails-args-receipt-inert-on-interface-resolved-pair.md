---
title: "@missingRailsArgs/@missingRailsCall receipt is silently inert when the pair resolves to a bodyless interface member"
status: draft
updated: 2026-09-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`@missingRailsArgs` / `@missingRailsCall` receipts are read out of the JSDoc of
the TS declaration the extractor records, and `recordTaggedCalls`
(`scripts/api-compare/compare.ts:1568-1589`) keys them by `(file, name, owner)`
where `owner` is the `tsClass`. `tagsForOwner` (`compare.ts:1553-1563`) then
looks the pair's `tsClass` up in that map.

For a mixin ported in the trails shape — a `this`-typed free function plus a
bodyless `interface` member that names it for hosts — the compared pair can
resolve to the INTERFACE member, whose `owner` is the interface name, while the
tag sits on the free function under `owner: ""`. Interface members are extracted
`bodyless: true` and carry no tag fields at all, so `tagsForOwner` finds nothing
and the receipt is inert. It is inert SILENTLY: `staleCallTags` does not report
it either, so the author sees a tag that reads correct, suppresses nothing, and
leaves them no choice but a baseline row.

Worked example from PR #7339: `activemodel/src/validations/comparability.ts ::
errorOptions` ports `activemodel/lib/active_model/validations/comparability.rb
:10-15`, whose `merge!` is called on the except-ed options Hash. The
receiver-first form ruby-compat's free-function `mergeBang` forces is exactly
what `@missingRailsArgs merge! — PERMANENT` exists to receipt, and the tag was
verified present in `output/ts-api.json`
(`"missingRailsArgs":["merge!"],"missingRailsArgsReasons":{"merge!":"PERMANENT"}`)
— yet the mismatch still flagged. The same tag on the same shape in
`actionpack/src/action-controller/metal/params-wrapper.ts ::
_performParameterWrapping` (no interface twin) suppresses correctly, which is
what makes the gap invisible: it looks like the tag family works.

The row went to
`scripts/api-compare/call-mismatches-exclude/activemodel/validations/comparability.json`
instead, with the gap named in its `reason`. Every mixin ported with an
interface twin has the same hole.

## Acceptance criteria

- A `@missingRailsArgs` / `@missingRailsCall` receipt on the free function
  suppresses the mismatch for a pair whose `tsClass` resolved to the bodyless
  interface member of the same name in the same file — the two declarations are
  one member, so one tag site serves both.
- Whatever the fix (union the owners when the resolved owner records no tags,
  or extract tags from interface members too), a tag that suppresses nothing
  is REPORTED, not silent: an inert receipt must surface through
  `staleCallTags` rather than reading as a working one.
- The `comparability.ts :: error_options -> merge!` row is deleted from
  `call-mismatches-exclude/activemodel/validations/comparability.json` and
  replaced by the receipt at the declaration; the file is removed if it empties.
- A `scripts/api-compare` unit test covers the interface-twin shape in both
  directions (tag honoured; inert tag reported).
- `pnpm parity:api:calls`, `parity:api:calls:args` green; no baseline widened.
