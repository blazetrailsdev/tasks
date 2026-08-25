---
title: "activesupport-json-encoding-time-precision"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5971
claim: "2026-08-03T14:13:48Z"
assignee: "activesupport-json-encoding-time-precision"
blocked-by: null
closed-reason: null
---

## Context

Rails' JSON encoder emits times with
`ActiveSupport::JSON::Encoding.time_precision` (default 3) fractional digits —
`Time.utc(2010).as_json` is `"2010-01-01T00:00:00.000Z"`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb`,
`Time#as_json` / `xmlschema(ActiveSupport::JSON::Encoding.time_precision)`).

Trails' `packages/activesupport/src/json/encoding.ts` carries only
`useStandardJsonTimeFormat` — no `timePrecision` — and
`packages/activesupport/src/json.ts` has no `asJson` arm for temporals, so a
`Temporal.Instant` falls through to `Instant#toJSON`, which drops a zero
subsecond part: `"2010-01-01T00:00:00Z"`.

Surfaced while porting `message_verifier_test.rb`'s
`alternative serialization method` (PR for
`port-activesupport-message-verifier-tests`), whose `exp` had to be written
against the second-precision string with a call-site note.

## Acceptance criteria

- `Encoding.timePrecision` exists, defaults to 3, and
  `ActiveSupportJSON.encode` honours it for temporal values.
- The deviation note in
  `packages/activesupport/src/message-verifier.test.ts`
  (`alternative serialization method`) is removed and `exp` converges on
  Rails' `"2010-01-01T00:00:00.000Z"`.
- Existing JSON-encoding tests updated for the new default precision.
