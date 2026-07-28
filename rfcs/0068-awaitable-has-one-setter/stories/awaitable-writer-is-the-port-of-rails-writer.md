---
title: "Treat set#{Name} as the api:compare port of Rails' #{name}= writer"
status: claimed
updated: 2026-07-28
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-07-28T01:46:16Z"
assignee: "awaitable-writer-is-the-port-of-rails-writer"
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

## Decision (recorded 2026-07-27)

`set#{Name}` stays — it is the idiomatic TS spelling of an awaitable write, and
it already delegates in exactly one line to the Rails-named method, mirroring
what Rails' own `define_writers` generates:

```ts
// has-one.ts:118-122
return this.association(name).writer(value);
```

```ruby
# builder/association.rb:108-110
def #{name}=(value)
  association(:#{name}).writer(value)
end
```

The rejected alternative was making `await record.association(name).writer(x)`
the sanctioned surface and deleting `set#{Name}`. It is Rails-verbatim and needs
no tooling change, but it is markedly more verbose at every call site for no
behavioural gain — the delegation target is identical either way.

**Prefer scoping the new candidate to association writers** rather than all Ruby
`name=` setters. The fidelity argument ("Rails' writer blocks on I/O, so the
faithful JS port must be awaitable") is only true for association writers; a
plain attribute writer has no I/O and its sync accessor is the correct port.
A global mapping would let any `foo=` be satisfied by an unrelated `setFoo`.

## Notes

Scope is the convention mapping + doc + accounting. Do NOT delete the `=`
setter: Rails defines `#{name}=`, so removing it would report the Rails method
missing and is a strictly worse parity position.
