---
title: "Port core_ext/object/json.rb's as_json into core-ext/object/json.ts"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: packages/activesupport/src/core-ext/object/json.ts exists on main and holds the as_json dispatch (asJson interface + per-class static asJson, json.ts:10-69)."
---

## Context

Rails puts the JSON serialization of temporals in core_ext monkey patches:
`activesupport/lib/active_support/core_ext/object/json.rb:199-227` defines
`Time#as_json`, `Date#as_json` and `DateTime#as_json`, each branching on
`ActiveSupport::JSON::Encoding.use_standard_json_time_format` and calling
`xmlschema(ActiveSupport::JSON::Encoding.time_precision)`.

PR #5971 implemented that behaviour as a private `temporalAsJson` helper inside
`packages/activesupport/src/json.ts`, because our Time analogues are the
`Temporal` classes and TS has no monkey patching. The file
`core-ext/object/json.ts` does not exist at all — `pnpm parity:api --package
activesupport` reports `core_ext/object/json.rb -> core-ext/object/json.ts
0/6 0%`, so none of the six `as_json` definitions in that Rails file count as
ported, and the logic that does exist lives at the wrong path for the
file-structure manifest.

## Converged shape

Create `packages/activesupport/src/core-ext/object/json.ts` mirroring
`core_ext/object/json.rb`, exporting the `as_json` implementations as
`this`-typed / value-dispatched functions (per CLAUDE.md's module-mixin
convention), and have `ActiveSupportJSON.encode` delegate to it rather than
carrying `temporalAsJson` inline. Cover at minimum the temporal arms already
implemented (`Instant`, `ZonedDateTime`, `PlainDateTime`, `PlainDate`) plus the
`Object#as_json` / `Hash#as_json` / `Array#as_json` traversal that `json.ts`
currently open-codes in `asJsonValue`.

## Acceptance criteria

- `packages/activesupport/src/core-ext/object/json.ts` exists and holds the
  `as_json` dispatch; `json.ts` delegates to it with no behaviour change.
- `parity:api` for `core_ext/object/json.rb` moves off 0/6.
- Existing `json/encoding.test.ts` and `json/encoding.trails.test.ts` pass
  unchanged.
