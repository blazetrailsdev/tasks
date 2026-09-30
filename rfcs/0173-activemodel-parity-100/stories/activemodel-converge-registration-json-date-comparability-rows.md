---
title: "activemodel: converge the call rows in attribute-registration, serializers/json, type/date and the comparability args row"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: calls-args
packages: ["activemodel"]
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

The remaining activemodel call-gate rows, one per file:

- `attribute-registration.ts` `type_for_attribute` omits `fetch`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb:43`) — seeded RFC 0126 reason, covered by
  the umbrella `burn-down-rfc0126-repairing-surfaced-call-rows` but small enough to converge here.
- `serializers/json.ts` `from_json` omits `first` (`vendor/rails/v8.0.2/activemodel/lib/active_model/serializers/json.rb:146`,
  `hash.values.first`) — spelled `Object.values(hash)[0]`; ruby-compat's Array/Enumerable `first` is the call.
- `type/date.ts` `new_date` omits `new` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/date.rb:66`,
  `::Date.new(year, mon, mday) rescue nil`) — the port builds a `Temporal.PlainDate`; `@blazetrails/date`
  (RFC 0088) is the `::Date` port and has `Date.new`.
- **args row** `validations/comparability.ts` `error_options` → `merge!`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/comparability.rb:10`) — `options.except(...).merge!(count:, value:)`;
  ruby-compat's `mergeBang` is a free function so the receiver moved into the argument list.

## Acceptance criteria

- [ ] Each body makes Rails' call with Rails' arguments; the 3 `calls` rows and 1 `args` row are deleted from their shards and the marks tightened.
- [ ] If the `merge!` receiver-as-first-argument shape is a gate artifact, fix it in `scripts/api-compare/receiver-as-first-arg.ts` with a test instead of changing the port.
- [ ] activemodel `pnpm parity:api:calls` rows 7 → 0 and shape rows 1 → 0 once `activemodel-converge-attribute-methods-call-rows` and `activemodel-converge-secure-password-bcrypt-password` land.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
