---
title: "A name private on one entity and public on another in one .rb folds to not-private, publishing Attributes#attribute"
status: done
updated: 2026-08-28
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 7145
claim: "2026-08-28T00:42:10Z"
assignee: "enroll-rack-in-unbacked-internal-receipt-lint"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7084 (RFC 0121 enrollment of `activemodel`).

`activemodel/lib/active_model/attributes.rb` declares the SAME name twice, at two
visibilities, in one file:

```ruby
def attribute(name, ...)      # attributes.rb:59  — PUBLIC, on ClassMethods
...
private
  def attribute(attr_name)    # attributes.rb:161 — PRIVATE, on the instance half
    @attributes.fetch_value(attr_name)
  end
```

`scripts/build-rails-privates-manifest.ts` folds a name to "not private" when any
contributor in the file is public, so `attribute` is absent from
`eslint/rails-private-methods.json` for
`packages/activemodel/src/attributes.ts`. PR #7057 made the manifest
entity-AWARE for `rails-private-jsdoc`, and `entities[rel]` does list both
`Attributes` and `ClassMethods` — but the `files[rel]` name list, which is what
both lint rules actually match on, is still folded per file.

Consequence, as shipped by PR #7084: the instance reader
`Attributes#attribute` (`attributes.ts`, the `readAttribute` dispatch target for
`define_proxy_call`'s generated bare pattern) carries NO `@internal` at all. A
first pass gave it `@internal` + a CONVERGEABLE receipt; the receipt was STALE —
`scripts/api-compare/extra-surface.ts` rejected it, correctly, because the name
is already answered by the public `ClassMethods#attribute` and so never flags as
extra — and the only remedy the rule offers for a tag that backs nothing is to
delete it. So a Rails-PRIVATE method is now published in the TypeDoc API
reference, which is the exact drift `rails-private-jsdoc` exists to prevent.

This is narrower than the mixin gap in
[[privates-manifest-misses-mixin-redeclaration-sites]] — same name, same file,
two visibilities on two entities — and may or may not fall out of that fix.
Check there first.

## Converged shape

Key the private-name list per entity, not per file: emit
`files[rel]` as today for backward compatibility, plus a per-entity name list
the rules consult when the TS declaration's enclosing entity is known.
`Attributes#attribute` is then private on the `Attributes` entity while
`ClassMethods#attribute` stays public, and `rails-private-jsdoc` can require the
`@internal` on the instance reader without demanding one on the class method.

## Acceptance criteria

- [ ] `eslint/rails-private-methods.json` distinguishes `attribute` private on
      `ActiveModel::Attributes` from `attribute` public on
      `Attributes::ClassMethods`.
- [ ] The instance reader in `packages/activemodel/src/attributes.ts` carries
      `@internal` again, backed by the manifest — no `@noRailsEquivalent`
      receipt, since it has a Rails counterpart.
- [ ] `blazetrailsdev/rails-private-jsdoc` does NOT demand `@internal` on the
      class-method `attribute` in the same file (the #7057 over-tagging
      regression must not return).
- [ ] `pnpm exec tsx scripts/api-compare/extra-surface.ts` exits 0 — no tag goes
      STALE.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
