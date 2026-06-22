---
title: "api-compare extractor: capture class_attribute/alias/delegate-generated Ruby methods"
status: ready
updated: 2026-06-18
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scripts/api-compare/extra-surface.ts` (`pnpm api:extra`, added in PR #3595)
surfaces TS public methods with no Rails counterpart. Its `novel` tier is
diluted by Ruby methods the **static** extractor (`extract-ruby-api.rb`)
cannot see because they're metaprogrammed or aliased, so their real TS ports
look invented. PR #3595 filtered the _enumerable_ classes in-tool
(`define_column_methods` column DSL, `Relation::VALUE_METHODS` accessors,
`?`→`Q` predicates), dropping AR novel 839 → 748. The residual false-novel
tail is **open-ended** and can only be fixed at the extractor:

- **`class_attribute` / `cattr_accessor` / `mattr_accessor`** — e.g. Base's
  `partial_inserts`, `default_shard`, `cache_versioning`,
  `automatic_scope_inversing`, `time_zone_aware_attributes`,
  `reading_role`/`writing_role`, `param_delimiter`. `extract-ruby-api.rb`
  dispatches `attr_reader/writer/accessor` (line ~580-586) but NOT
  `class_attribute` & friends — they generate getter/setter/`?` accessors.
- **Bare `alias` keyword** (vs `alias_method`, which IS handled, line 586) —
  e.g. `alias :blob :binary`, `alias :belongs_to :references`,
  `alias extensions extending_values`. The `:alias` AST node isn't dispatched.
- **`delegate`** — `process_delegate` (line ~844) is a deliberate no-op
  ("too complex"); Querying's `delegate … to: :all` finder surface and
  `left_joins` are invisible.
- **GlobalID mixin** — `to_gid`/`to_sgid`/`find_global_id` from
  `GlobalID::Identification` (globalid gem) resolve inconsistently.

## Acceptance criteria

- `extract-ruby-api.rb` captures `class_attribute`/`cattr_accessor`/
  `mattr_accessor`-generated reader/writer/predicate methods (with the
  `?`→predicate form), the bare `alias` keyword, and at minimum the
  static-resolvable `delegate … to:` targets.
- Re-running `pnpm api:extra --package activerecord --novel-only` shows the
  `class_attribute`/alias/delegate false-novels gone from `base.ts`,
  `inheritance.ts`, `relation.ts` (spot-check: `partialInserts`,
  `defaultShard`, `leftJoins`, `whereNot` no longer novel).
- **Re-verify the `pnpm api:compare` gate** — adding Ruby methods mutates the
  shared `rails-api.json`; confirm coverage %/arity and the compare.ts test
  suite still pass (this is why it was NOT bundled into the audit-tool PR).
- Drop the now-redundant in-tool allow-sets in `extra-surface.ts`
  (`RAILS_RELATION_VALUE_METHODS`, `RAILS_DSL_GENERATED`) where the extractor
  now covers them, keeping the tool a pure consumer of the manifest.
