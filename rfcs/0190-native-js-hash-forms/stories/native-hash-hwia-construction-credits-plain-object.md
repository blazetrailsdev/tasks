---
title: "native-hash-hwia-construction-credits-plain-object"
status: done
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8944
claim: "2026-10-15T17:31:57Z"
assignee: "key-read-receiver-unread-structural-rows-converge"
blocked-by: null
closed-reason: null
---

## Context

RFC 0190 settles that a Rails `HashWithIndifferentAccess.new` / `{}.with_indifferent_access`
construction may port either as `new HashWithIndifferentAccess()` or as a plain
object (`{}` / `Object.create(null)`) where the consumer reads only literal
string keys. The call gates do not know that: a body that takes the plain-object
arm reports the Rails `new` (receiver `HashWithIndifferentAccess`) /
`with_indifferent_access` as a missing call, so the site has to carry a
`@missingRailsCall … PERMANENT` receipt for a decided, non-deviating shape.

Example (trails#8941): `ParamBuilder#makeParams`
(`packages/actionpack/src/action-dispatch/http/param-builder.ts`) returns
`Object.create(null) as ParamHash`, mirroring `make_params`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/param_builder.rb:162-164`,
`ActiveSupport::HashWithIndifferentAccess.new`), and needs
`@missingRailsCall new — PERMANENT`.

The native-form crediting lives in `NATIVE_FORM_ANALOGUES`
(`scripts/api-compare/enumerable-idioms.ts`), consumed by `compare.ts` and
`call-args.ts` (`NATIVE_FORM_PREFIX`).

## Acceptance criteria

- `parity:api:calls` (and `parity:api:calls:args`) credit a Rails
  `HashWithIndifferentAccess.new` (no args, or one hash arg) and
  `x.with_indifferent_access` / `{}.with_indifferent_access` when the TS body
  builds a `{}` object literal, `Object.create(null)`, or
  `new HashWithIndifferentAccess(...)` in that position. Credit is scoped to the
  HWIA receiver, not to every `new`.
- Remove the `@missingRailsCall new — PERMANENT` receipt from
  `ParamBuilder#makeParams`, and sweep other `@missingRailsCall` receipts that
  exist only for this shape (`grep -rn "@missingRailsCall \(new\|with_indifferent_access\)" packages/*/src`);
  delete any call-mismatches-exclude rows that become stale and run
  `parity:api:calls:tighten`.
- Unit tests in the comparer for each credited form, plus a negative case
  (a `new Foo()` for a Rails `HashWithIndifferentAccess.new` stays uncredited).
