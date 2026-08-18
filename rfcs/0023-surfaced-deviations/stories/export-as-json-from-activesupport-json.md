---
title: "Export Object#as_json from activesupport json.ts instead of per-caller encode/decode round-trips"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: asJson is now a public export of @blazetrails/activesupport (Rails' Object#as_json, core_ext/object/json.rb:58) and token-for.ts:138 uses it directly instead of the local decode(encode(...)) helper."
---

## Context

`packages/activerecord/src/token-for.ts` (PR #5912) needed Ruby's
`Object#as_json` for `TokenDefinition#payloadFor`
(`vendor/rails/activerecord/lib/active_record/token_for.rb:24` —
`model.instance_eval(&block).as_json`). ActiveSupport ports the traversal in
`packages/activesupport/src/json.ts`, but only `asJsonValue` (module-private,
line 41) implements it; the sole export is `ActiveSupportJSON` (line 141), so
token-for.ts had to spell the projection as a local helper doing
`ActiveSupportJSON.decode(ActiveSupportJSON.encode(value))`.

Rails' counterpart is a real public API:
`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:58`
defines `Object#as_json`, available on every object.

## Acceptance criteria

- ActiveSupport exposes an `as_json` port (the existing `asJsonValue`
  traversal, options included) rather than keeping it module-private.
- `token-for.ts`'s local `asJson` encode/decode round-trip is deleted in
  favour of the shared one; the `token-for` tests stay green with names
  unchanged.
- parity:api credits `as_json` where Rails declares it; no new extra-surface
  allowlist entries.
