---
title: "Stop dropping weak-receiver Ruby sites the port really calls from the call-arg population"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6493
claim: "2026-08-13T20:57:11Z"
assignee: "converge-hash-to-message-construction-order"
blocked-by: null
closed-reason: null
---

## Context

Fallout from `call-args-schema-definitions-add-to-foreign-key` (PR #6488).

`compare.ts#checkCallArgs` drops every Ruby call site flagged `weak` — the
per-site inert-receiver flag `extract-ruby-api.rb#inert_receiver?` records. That
is right for `xs.map` / `opts.fetch`, but it also drops sites whose receiver is
a genuine ported object the extractor cannot tell apart from a plain local.

`schema_definitions.rb:242` is the measured case:

```ruby
table.foreign_key(foreign_table_name, **foreign_key_options)
```

`table` is a `TableDefinition` — a ported class — yet the site is weak, so the
argument gate compares NOTHING for `add_to` → `foreign_key`, even though
`schema-definitions.ts:842` makes exactly that call. PR #6488 stopped the guard
read from being paired against it (the visible symptom); the site itself is
still outside the population. Same shape at
`preloader/branch.rb` `grouped_records` / `preloaders_for_reflection`,
`association_scope.rb` `transform_value`, `shard_selector.rb` `selected_shard`,
`normalization.rb` `normalize`.

## Acceptance criteria

- [ ] A weak Ruby site whose receiver resolves to a ported class/param is
      compared by `checkCallArgs` rather than dropped (e.g. narrow the drop to
      receivers with no ported counterpart, or keep weak sites when the TS side
      has an unconsumed same-named site).
- [ ] `add_to` → `foreign_key` compares its real site (`schema_definitions.rb:242`
      vs `schema-definitions.ts:842`) and matches.
- [ ] Call-arg compared population grows; any new shape row that is a PAIRING
      artifact of the widening is fixed in the tooling, not baselined.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.

### Scope amendment (PR #6493)

Widening the population surfaced six PRE-EXISTING argument divergences in
bodies this story does not touch, across five packages
(`relation.rb:621`/`:629`, `testing/time_helpers.rb:177-178`,
`multipart/parser.rb:259`, `source_annotation_extractor.rb`). Converging them
means rewriting those bodies — `Relation#update`'s `id = :all` signature among
them — which is neither this story's subject nor within one PR's LOC budget.

They are therefore baselined with a specific per-row reason: two are TS language
shortcomings stated at the row (`IO#read`'s `outbuf` has no JS spelling; JS has
no method table to stub a built-in constructor's static through), and the
remaining four are tracked for convergence by
`0099/converge-weak-receiver-surfaced-call-arg-rows`. The one row that WAS an
artifact of the widening — Ruby's proc `#call` pairing against TS's
`Function.prototype.call` — was fixed in the tooling instead.
