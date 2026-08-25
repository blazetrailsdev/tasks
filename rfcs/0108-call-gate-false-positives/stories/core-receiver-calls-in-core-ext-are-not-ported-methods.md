---
title: "Drop Ruby core/stdlib receiver calls in core_ext bodies from the call gate"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6680
claim: "2026-08-18T00:23:01Z"
assignee: "port-request-session-options-instance"
blocked-by: null
closed-reason: null
---

## Context

Measured while implementing `resolve-duplicate-declaration-owners-one-body-two-seats`
(PR #6676). That arm raised call-set comparisons 5583 → 5761, and all 21 new
mismatch records it surfaced (33 individual calls, every one in activesupport)
turned out to be the SAME false positive: the gate matches a Ruby body call by
NAME only, so a call to a Ruby **core/stdlib** method on the receiver collides
with an unrelated ported trails name in another package and is reported as a
dropped delegation.

Every row baselined in PR #6676 is an instance
(`scripts/api-compare/call-mismatches-exclude/activesupport/**`):

- `Integer#div` — `core_ext/array/grouping.rb:66` (`size.div number`), matched
  against `Date#div` / `Duration#div`.
- `Array#reject!` — `core_ext/array/extract.rb:15`, matched against
  `DescendantsTracker.rejectBang` (`descendants-tracker.ts:97`).
- `Enumerable#first` / `#last` / `#count` / `#compact` / `#any?` —
  `core_ext/enumerable.rb:93-99, 197-207, 211-217, 241-247`, matched against
  `Relation#first`, `Querying.last`, `Querying.count`, …
- `String#unpack` — `core_ext/digest/uuid.rb:19-38`, matched against
  `Cache::Entry.unpack` (`cache/entry.ts:16`).
- `File.exist?` / `.stat` / `.rename` — `core_ext/file/atomic.rb:21-52, 56-64`,
  matched against `ConnectionPool#stat`, `Directory#stat`.
- `Time#getlocal` / `#utc?` / `#utc_offset` / `#subsec` —
  `core_ext/time/calculations.rb:107-109, 123-155`,
  `core_ext/time/compatibility.rb:13-15`, `core_ext/date/conversions.rb:83-85`.
- `Module#define_method` / `#redefine_method` / `Module.new` —
  `deprecation/method_wrappers.rb:35-49`.
- `Array#include?` — `inflector/transliterate.rb:66`.

The gate already has a precedent for this class of drop: `dropWeakCalls` /
`inert_receiver?` in `scripts/api-compare/extract-ruby-api.rb`, which drops a
call whose RECEIVER says the call is not a ported-method call. A Ruby core
method invoked on `self` inside a `core_ext/**` refinement is the same shape —
`self` there IS the Ruby core object, so no call on it can be a trails port.

## Acceptance criteria

- The gate stops reporting a Ruby core/stdlib method call made on the receiver
  inside a `core_ext/**` (or otherwise core-monkey-patching) Ruby body. Prefer
  extending the existing `inert_receiver?` / `dropWeakCalls` machinery over a
  new mechanism.
- The 33 rows PR #6676 added under
  `call-mismatches-exclude/activesupport/**` are DELETED, not re-justified —
  they are debt, not permission. Lower the resulting stale high-water marks
  with `pnpm parity:api:calls:tighten <shard>`, never a reseed.
- No comparison count regresses; `pnpm parity:api:calls` and
  `pnpm parity:api:calls:args` stay green.
- Unit tests in `scripts/api-compare` cover both a dropped core call and a
  genuine ported call on the same receiver that must still be reported.
