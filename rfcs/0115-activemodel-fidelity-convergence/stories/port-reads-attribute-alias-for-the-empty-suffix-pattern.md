---
title: "Port Read's `alias :attribute :_read_attribute` so the empty-suffix pattern has a proxy target"
status: in-progress
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7176
claim: "2026-08-28T17:49:38Z"
assignee: "assert-boolean-attribute-tests-through-the-generated-predicate"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::AttributeMethods::Read` ends with an alias that trails does not
port (`vendor/rails/activerecord/lib/active_record/attribute_methods/read.rb:41-42`):

```ruby
alias :attribute :_read_attribute
private :attribute
```

That name is the proxy target the bare (empty-suffix) attribute-method pattern
dispatches to, exactly as `attribute=` is Write's (write.rb:45) and `attribute?`
is Query's (query.rb:25). trails carries the other two —
`packages/activerecord/src/base.ts` has `"attribute=": _writeAttributeLowLevel`
in the prototype object literal, and
`packages/activerecord/src/attribute-methods/query.ts` gained
`"attribute?": queryAttribute` in PR #7170 — but nothing defines `attribute`.

Surfaced while giving the attribute-methods seats real `include()` calls
(`give-the-remaining-attribute-methods-seats-real-include-calls`, PR #7170).
Registering Query's `?` suffix without its alias raised
`MissingAttributeError: attribute_missing dispatch failed: attribute? not defined`,
which is what exposed the pattern-target convention; `Read`'s member of that
trio is still absent. It is latent rather than failing today because trails
generates bare readers as accessor properties through `defineMethodAttribute`
(CLAUDE.md, "Generated attribute readers are properties") rather than through
ActiveModel's `define_proxy_call` fallback — so the empty-suffix pattern is
registered but its proxy path is not currently taken.

## Converged shape

`Read`'s module object in `packages/activerecord/src/attribute-methods/read.ts`
carries `attribute` alongside `readAttribute` / `_readAttribute`, aliased to
`_readAttribute` per read.rb:41, so the empty-suffix pattern has a target
whichever generation route is taken.

## Acceptance criteria

- [ ] `Read` exports `attribute` aliased to `_readAttribute`, mirroring
      read.rb:41-42, and it arrives on `Base` through the existing
      `include(Base, _Read)` at the attribute_methods.rb:13 seat.
- [ ] A test drives the empty-suffix pattern's proxy path and gets the
      attribute value rather than a `MissingAttributeError` — the Read twin of
      the `?` regression test in
      `packages/activerecord/src/attribute-methods/query.trails.test.ts`.
- [ ] Rails' `private :attribute` is honoured (the name is `@internal` /
      not part of the measured public surface).
- [ ] activerecord suite green on all three adapter lanes.
