---
title: "enum() forwards all leftover attribute options to attribute(), not just default:"
status: closed
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 27
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "No-op per acceptance criterion #3: only widen the enum→attribute() passthrough once a SECOND attribute-level enum option exists. Today enum()'s surface exposes exactly one attribute-level option (default:); prefix/suffix/scopes/instanceMethods/validate are all macro-level and stripped before attribute(). Widening now would be the speculative generic passthrough criterion #3 forbids. Re-open when a second attribute-level option (e.g. limit/precision) is added to the enum surface."
---

## Context

`enum-macro-default-scopes-instance-methods-options` (PR #4745) wired the
macro-level `default:` option into trails' `_enum` by threading it through
`installEnumAttribute(klass, attr, enumType, { default })` (see
`packages/activerecord/src/enum.ts`). Rails' `_enum` forwards ALL leftover
`**options` (after stripping `prefix`/`suffix`/`scopes`/`instance_methods`/
`validate`) into `attribute(name, **options)`
(`vendor/rails/activerecord/lib/active_record/enum.rb:238`), not just
`default:`. trails' `attributeOptions?: { default?: unknown }` narrows the
passthrough to `default` only.

This is fine today because `default` is the only additional attribute option
`_enum`'s TS signature exposes, but it is a narrower-than-Rails passthrough:
any future attribute-level option (e.g. array/range/precision variants) would
be silently dropped rather than forwarded to `attribute()`. Flagged in the
Claude review of PR #4745.

## Acceptance criteria

- [ ] `_enum` forwards its leftover attribute options (beyond `default`) into
      `installEnumAttribute` → `klass.attribute(name, options)`, mirroring Rails'
      `attribute(name, **options)` splat (enum.rb:238).
- [ ] `installEnumAttribute`'s options parameter widens beyond
      `{ default?: unknown }` to carry the full leftover-option bag.
- [ ] Only pursue this once a second attribute-level enum option actually
      exists to forward (do not add an unused generic passthrough speculatively).
