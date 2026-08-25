---
title: "EncryptedAttributeType's previous-types generation memo is a trails invention"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6116
claim: "2026-08-05T03:00:02Z"
assignee: "fold-narrow-call-ratchet-into-wide"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/encrypted-attribute-type.ts` carries a
module-level generation counter, `_globalPreviousVersion` (:19), and three
instance memos keyed on it: `previousTypes` (:184), `_effectivePreviousSchemes`
(:207) and `isSerializeWithOldest` (:307). Rails has none of them —
`EncryptedAttributeType#previous_types` recomputes on every call
(activerecord/lib/active_record/encryption/encrypted_attribute_type.rb:70-72,
`previous_schemes.collect { |scheme| EncryptedAttributeType.new(...) }`), and
`previous_schemes` is read straight off the scheme each time.

The counter needs invalidating whenever config changes. Before #6108 that was a
`Configurable.onConfigure` hook — itself a trails invention, deleted by
`remove-encryption-configure-hook-and-key-provider-cache`. #6108 rehomed the
trigger onto the default context's identity (`globalPreviousGeneration`,
:33-40), since `configure` ends in `reset_default_context`
(configurable.rb:35-37). That removed the invented hook but left the invented
memo it existed to serve.

Called out by the #6108 reviewer as pre-existing and out of that story's scope.

## Converged shape

Delete `_globalPreviousVersion`, `_lastDefaultContext`,
`globalPreviousGeneration`, `_previousTypesMemo` / `_previousTypesMemoKey`,
`_effectivePrevMemo` / `_effectivePrevVersion`, and
`_serializeWithOldestMemo` / `_serializeWithOldestVersion`, and recompute the
way encrypted_attribute_type.rb does.

If the recompute turns out to be genuinely hot, measure it first — the burden
is a benchmark, not an assumption, and a kept memo needs a
`@noRailsEquivalent` receipt rather than silence.

Note `setGlobalPreviousSchemesFn` (:22-25) is a separate trails invention (a
cycle-breaking injection point for `encryptable-record.ts`) and is not in scope
here; only the memo/generation machinery is.

## Acceptance criteria

- [ ] No generation counter or memo keyed on one remains in the file.
- [ ] `previousTypes` / `_effectivePreviousSchemes` / `isSerializeWithOldest`
      recompute per call, as Rails does.
- [ ] Encryption suites green on all three lanes, including the
      configure-after-`encrypts()` lazy-resolution cases.
