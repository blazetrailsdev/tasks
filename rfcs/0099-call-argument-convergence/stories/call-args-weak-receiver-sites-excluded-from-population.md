---
title: "Stop dropping weak-receiver Ruby sites the port really calls from the call-arg population"
status: ready
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
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
- [ ] Call-arg compared population grows; any new shape rows are converged, not
      baselined.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
