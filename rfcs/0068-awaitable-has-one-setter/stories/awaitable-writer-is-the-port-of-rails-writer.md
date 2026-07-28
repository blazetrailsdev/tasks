---
title: "Treat set#{Name} as the api:compare port of Rails' #{name}= writer"
status: ready
updated: 2026-07-28
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0068 added the awaitable `set#{Name}(x)` writer beside the Rails-named `=`
property setter (`packages/activerecord/src/associations/builder/has-one.ts:102-142`).
Today `api:compare` treats them asymmetrically: `rubyMethodToTs`
(`scripts/api-compare/conventions.ts:638-641`) maps Ruby `name=` to the single
candidate `[snakeToCamel(base)]`, so `account=` is considered ported by a bare
`account` accessor, and `setAccount` counts as _extra TS-only surface_.

That accounting inverts the actual fidelity. Rails' `account=` blocks inline on
`remove_target!` + `save` (`has_one_association.rb:59-84`). A synchronous JS
property setter cannot express blocking I/O; a promise-returning method can.
So `setAccount` is the _more_ faithful rendering of Rails' writer semantics, and
the sync setter is faithful only on the branch where Rails does no I/O either
(unpersisted owner — `syncWrite`, `has-one-association.ts:40-58`).

## Acceptance criteria

- [ ] `rubyMethodToTs` returns `set#{Cap}` as an additional candidate for Ruby
      `name=`, ordered _after_ the bare camel name so existing plain-value
      writers (`tableName`, `_reflections=`) keep matching as they do now.
- [ ] `explainConventions()` documents the new candidate; the conventions doc
      regenerates and `conventions-doc.ts --check` passes.
- [ ] `setAccount`/`set#{Name}` no longer appear as extra TS-only surface, and
      `account=` is reported ported.
- [ ] Confirm the api:extra totals move in the expected direction and no
      unrelated Rails writer silently starts matching a `setX` that was never
      intended as its port.
- [ ] Decide + record the role of the sync `=` setter under this framing: it
      becomes a deprecation shim steering callers to the awaitable port, not a
      co-equal writer. Its persisted-owner `HasOnePersistedAssignmentError`
      throw remains a deviation from Rails (which raises nothing there) and
      should be justified at the call site as such.

## Notes

Scope is the convention mapping + doc + accounting. Do NOT delete the `=`
setter: Rails defines `#{name}=`, so removing it would report the Rails method
missing and is a strictly worse parity position.
