---
title: "Flag a closed instanceof list in a body whose Rails counterpart asks respond_to? or acts_like?"
status: draft
updated: 2026-09-20
rfc: "0156-parity-beyond-name-presence"
cluster: "lints"
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Six 0155 stories are one shape: Rails duck-types, the port enumerates classes, and a value outside the list falls through uncast or raises.

- `date-cast-value-middle-arm-is-instanceof-not-to-date`: `value.respond_to?(:to_date)` (`vendor/rails/activemodel/lib/active_model/type/date.rb:39-48`) ported as three `instanceof` checks (`packages/activemodel/src/type/date.ts:44-63`), so `@blazetrails/date`'s `Time` is returned uncast.
- `duration-sum-guard-is-an-instanceof-list-not-acts-like` and `duration-since-rejects-a-datetime-receiver` (`duration.rb:486-489`, `packages/activesupport/src/duration.ts:424-437`).
- `sanitize-quote-bound-value-enumerable-duck-test` (`sanitization.rb:191-200`, `sanitization.ts:321`).
- `deprecation-behavior-does-not-accept-callable-objects`, `assertion-surfaced-secure-password-challenge-respond-to`.
- `time-zone-converter-cast-missing-infinite-arm` drops a `respond_to?(:infinite?)` arm outright.

**Prior rejection, and why this differs.** RFC 0113 measured whole-population arm comparison at 75% non-real and runs it ungated permanently. Its single missing-`throw` stratum measured 88.4% real and gates (`seed-a-missing-throw-arm-ratchet`). This story is another single stratum, keyed on one Ruby call name, not a revival of the general comparison.

`call-skeletons.json` already carries both bodies' tokens, including the Ruby-side `ref:respond_to?` (151 occurrences on `4e7c35e36b`) and `ref:acts_like?` (10), so this needs no extractor change on the Ruby side.

## Acceptance criteria

- A report lists each matched pair whose Ruby skeleton has `ref:respond_to?` or `ref:acts_like?` and whose TS body has an `instanceof` and no `rbObjRespondTo` / `actsLike` call.
- All seven stories above appear in it, or the PR body says why one does not.
- Every row of the first run is hand-audited and the real rate is in the PR body.
- It gates, as a ratchet with a mark file, only if the real rate clears RFC 0113's tripwire. Otherwise it stays a report and the PR records that.
