---
title: "Stop crediting a multi-candidate Ruby call against a later TS read in order rows"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6431
claim: "2026-08-12T18:56:50Z"
assignee: "extractor-multi-candidate-call-credits-later-read"
blocked-by: null
closed-reason: null
---

## Context

Left behind by PR #6428 (RFC 0099,
`converge-persistence-recomputed-pairing-rows`), which converged the body but
could not clear the row.

`_raise_record_not_destroyed` carries an order row in
`scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json`:

```text
order:constructor,primaryKey → primaryKey,constructor
```

The bodies agree. Rails
(`vendor/rails/activerecord/lib/active_record/persistence.rb:949-955`):

```ruby
key = self.class.primary_key
raise @_association_destroy_exception || RecordNotDestroyed.new("Failed to destroy #{self.class} with #{key}=#{id}", self)
```

The port reads `this.constructor.primaryKey`, then `this.constructor.name` in
the message — the same sequence. The extracted TS `callSeq` in
`scripts/api-compare/output/ts-api.json` confirms it:

```json
[
  "_associationDestroyException",
  "constructor",
  "primaryKey",
  "isArray",
  "join",
  "name",
  "id",
  "String"
]
```

`constructor` precedes `primaryKey`, exactly as Ruby's `class` precedes
`primary_key`. The row survives anyway: Ruby `class` maps to a candidate SET
that includes `name`, and the resolver credits it against the LATER `name`
read (index 5) rather than `constructor` (index 1), inverting the reported
pair. Verified during #6428 by hoisting the `name` read above the `primaryKey`
read, which did not clear the row either — the resolution, not the source
order, is what decides it.

This is the same family as the `extractor-*` order-artifact stories already
landed under this RFC.

## Converged shape

`reorderedCalls` (`scripts/api-compare/compare.ts:547`) resolves a Ruby call
whose `mapCall` returns several TS candidates to the candidate whose position
is consistent with the rest of the sequence — or treats it as ambiguous and
skips it, as `ambiguousTsNames` already does for the Ruby-side collision — so
a body that matches Rails' order is not flagged. The
`_raise_record_not_destroyed` row is then deleted by hand (only-shrink; never
`--write`), along with any sibling rows the fix makes stale.

## Acceptance criteria

- [ ] A multi-candidate Ruby call name no longer credits a later TS read when
      an earlier candidate is present, or is skipped as ambiguous.
- [ ] The `_raise_record_not_destroyed` order row is deleted; every other row
      the change makes stale is deleted with it.
- [ ] `pnpm parity:api:calls` green; the extractor's own unit tests cover the
      multi-candidate case.
