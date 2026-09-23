---
title: "plural-existence-predicates-spell-has"
status: draft
updated: 2026-09-23
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rubyMethodToTs` (`scripts/parity/conventions.ts:1453`) offers a Ruby predicate
`x?` the candidates `isX` and the bare `x`, plus a `has*` spelling only when the
name is in `HAS_PREDICATE_ALIASES` (`:1400-1403`), which today holds exactly
`key? -> hasKey` and `value? -> hasValue`. Those two qualified because Rails
itself defines `has_key?` / `has_value?` as aliases — the admission rule set by
trails#7981 and re-litigated by `ruby-method-to-ts-key-predicate-candidate`
(trails#7306, which settled `has` as a bare CALL alias only).

That rule has no room for a predicate whose subject is a plural noun, where the
question Rails is asking is "are there any?" and `is*` reads wrong:
`ConnectionHandler#active_connections?`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:157`)
ports as `isActiveConnections`. This came up on trails#8011, where
`isActiveConnections` shipped because it is the only spelling the table
produces; the user's stated preference is `hasActiveConnections`.

The population is real but bounded. Plural-noun predicates across
`vendor/rails/*/lib` that are NOT already verb-led (`supports_*?`, `*_exists?`,
`matches?`, `has_*?`) include: `active_connections?`, `active_workers?`,
`any_changes?`, `attachments?`, `default_scopes?`, `duplicates?`,
`eligible_waiters?`, `grouped_choices?`, `many_workers?`, `nested_attributes?`,
`resources?`, `routes?`, `saved_changes?`, `scope_attributes?`, `seeds?`,
`database_tasks?`, `prepared_statements?`, `record_timestamps?`.

## The tension to decide

Plurality alone is not the semantics. `prepared_statements?`
(`abstract_adapter.rb`) and `record_timestamps?` are configuration flags — "is
this enabled?" — where `hasPreparedStatements` is worse than
`isPreparedStatements`, not better. `active_connections?` and `attachments?` are
existence questions, where `has*` is plainly right. So the rule cannot be "plural
noun => has"; it needs a discriminator, and the candidate list is the lever that
makes that cheap.

## Acceptance criteria

- `HAS_PREDICATE_ALIASES` (or a new sibling map, if the alias-of-`has_*?`
  admission rule is worth preserving under its own name) gains the
  existence-question plural predicates, with the discriminator written down in a
  comment beside the map — including why `prepared_statements?` and
  `record_timestamps?` are excluded.
- `active_connections?` is among them, so `hasActiveConnections` pairs with it.
- The `has*` spelling is APPENDED as a further candidate, never a replacement:
  `isActiveConnections` must keep pairing, so no already-merged name reds
  `parity:api` or `parity:api:extra:gate` when this lands.
- `docs/ruby-ts-conventions.md` regenerates from the change (never hand-edited).
- The `scripts/` test asserting the mapping covers at least one newly-admitted
  name and one deliberately-excluded one.
- Renaming existing merged `is*` spellings to `has*` is OUT of scope here; if the
  team wants the renames, they are a follow-up story per package.
