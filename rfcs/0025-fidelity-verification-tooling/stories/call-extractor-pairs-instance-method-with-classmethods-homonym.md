---
title: "Call extractor pairs a Ruby instance method with its TS ClassMethods homonym"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
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
closed-reason: "Superseded by precise-call-pairing-key-for-owner-static-and-accessor (2026-08-17 sweep): all five are one root cause — the <package,tsFile,rubyName> row key cannot name the member on either side. Every citation and baselined row from this story is carried into that body as an acceptance criterion."
---

## Context

Surfaced by PR #6430 (fold `_performUpdate` into `Persistence#_updateRecord`).

`persistence.ts` defines two `_updateRecord`s, mirroring the two Rails methods
of that name in `activerecord/lib/active_record/persistence.rb`:

- the **ClassMethods** one, `_update_record(values, constraints)`
  (`persistence.rb:687-692`) — `persistence.ts:316`;
- the **instance** one, `_update_record(attribute_names = …)`
  (`persistence.rb:900-916`) — `persistence.ts` `instanceUpdateRecord`, exported
  onto the prototype as `_updateRecord` via `InstanceMethods`.

The call extractor pairs the Ruby instance `_update_record` with the TS
**ClassMethods** body. The observable symptom: PR #6430 made the instance body
call `attributesForUpdate` — exactly the call Rails' instance `_update_record`
makes at `persistence.rb:901` — and the
`_update_record` / `attributes_for_update` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json:33-36`
did NOT go stale, because the gate is still reading the class-method body, which
legitimately never calls it. So the row is un-retirable by writing correct code:
the only way to clear it is to fix the pairing.

This mis-pairing is silent and bidirectional — it also means calls the
ClassMethods body makes are scored against the instance Ruby method's
expectations, so a genuine omission in either body can be masked by the other.
`persistence.rb` is the worst case (two same-named pairs in one file), but any
file where Rails defines a `ClassMethods` method and an instance method with the
same name has it.

## Converged shape

The extractor already knows each TS member's static/instance kind (the
file-structure manifest interleaves class and instance members by line —
see `method-order-interleave-class-instance-methods-by-line`, done) and knows
whether a Ruby method is defined inside `module ClassMethods` / `class << self`
versus the instance body. Pair on `(name, staticness)` rather than `name` alone,
and when a TS file wires an instance method through an aliased top-level function
(`instanceUpdateRecord` → `InstanceMethods._updateRecord`), resolve through the
wiring table the same way the extractor already resolves other mixin exports.

Verify with `persistence.rb` specifically: after the fix, the
`_update_record` / `attributes_for_update` row must go stale (the instance body
does call it) and must be deleted by hand from `persistence.json` — only-shrink,
never `--write`.

## Acceptance criteria

- [ ] The Ruby instance `_update_record` (`persistence.rb:900-916`) pairs with
      the instance TS body, and the ClassMethods `_update_record`
      (`persistence.rb:687-692`) pairs with `persistence.ts:316`.
- [ ] The `_update_record` / `attributes_for_update` row is deleted from
      `persistence.json` as newly stale, by hand.
- [ ] A regression fixture covers a file with a same-named ClassMethods/instance
      pair and fails on the pre-fix pairing.
- [ ] `pnpm parity:api:calls` / `:args` green; any rows the re-pairing newly
      surfaces are either converged or given a reviewed one-line reason, and the
      net row count does not grow.
