---
title: "Offer a has* candidate for plural-noun predicates (active_connections? → hasActiveConnections)"
status: in-progress
updated: 2026-09-23
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8012
claim: "2026-09-23T19:50:07Z"
assignee: "plural-existence-predicates-spell-has"
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

## Decision: no discriminator

An earlier draft of this story asked for a discriminator: config flags such as
`prepared_statements?` (`abstract_adapter.rb:234`) and `record_timestamps?`
(`insert_all.rb:87`) would stay `is*`-only, while existence questions such as
`active_connections?` would also get `has*`. The maintainer rejected every
exclusion on trails#8012. `has*` is only ever an APPENDED candidate, never
imposed, so offering it costs nothing where it reads worse, and each port chooses
the spelling that fits. So every name in the population above is admitted,
whether its body is a flag, a threshold, an equality check or an existence test.

## Acceptance criteria

- [ ] A sibling map beside `HAS_PREDICATE_ALIASES` (keeping that map's
      alias-of-`has_*?` admission rule under its own name) admits every
      plural-noun predicate in the population above, with no discriminator. None
      of them has a `has_*?` sibling in `vendor/rails/*/lib`, so the
      `encrypted_attributes?` collision `HAS_PREDICATE_ALIASES` guards against
      cannot arise.
- [ ] `active_connections?` is among them, so `hasActiveConnections` pairs with
      it.
- [ ] The `has*` spelling is APPENDED as a further candidate, never a
      replacement: `isActiveConnections` must keep pairing, so no already-merged
      name reds `parity:api` or `parity:api:extra:gate` when this lands.
- [ ] `docs/ruby-ts-conventions.md` regenerates from the change (never
      hand-edited).
- [ ] `packages/activesupport/src/support/rails-private-methods.generated.ts`
      regenerates from the change via `pnpm rails-privates:manifest`. Its
      private-helper candidate lists pick up the new `has*` spellings, and the
      `Rails API/Test Comparison` CI job fails on drift.
- [ ] The `scripts/` test asserting the mapping covers at least one admitted
      name, one former config-flag candidate (`prepared_statements?`), and one
      non-plural predicate that gets no `has*`.

## Definition of done

Renaming existing merged `is*` spellings to `has*` does NOT close this story and
is out of scope. If the team wants the renames, they are a follow-up story per
package.

## Verification

- `pnpm vitest run scripts/parity/conventions.test.ts`
- `pnpm parity:api:conventions` leaves `docs/ruby-ts-conventions.md` unchanged.
- `pnpm rails-privates:manifest` leaves the generated artifact unchanged.
- `pnpm parity:api:extra:gate`, `pnpm parity:api:calls` and
  `pnpm parity:api:calls:args` stay green.
