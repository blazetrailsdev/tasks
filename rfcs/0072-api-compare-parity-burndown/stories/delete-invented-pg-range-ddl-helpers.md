---
title: "delete-invented-pg-range-ddl-helpers"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5916
claim: "2026-08-02T19:49:25Z"
assignee: "delete-invented-pg-range-ddl-helpers"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080).
`connection-adapters/postgresql-adapter.ts:4301` (`createRange`) and `:4318`
(`dropRange`) are tagged as having no Rails equivalent. That is true and it is
the problem: Rails has no range-type DDL helper anywhere. A grep of
`vendor/rails/activerecord/lib/active_record` for range DDL finds nothing; the
only type-DDL helpers Rails ships are the enum quartet
(`postgresql_adapter.rb:541` `create_enum`, `:571` `drop_enum`, plus
`rename_enum`/`rename_enum_value`), stubbed on the base at
`abstract_adapter.rb:576-580`.

This is not a TypeScript limitation and not unfinished porting. It is an
invented feature modelled on Rails' enum helpers. Under the repo's
fidelity-first rule, invented public API is deleted rather than excused, and a
tag on it moves the excuse from JSON to JSDoc without doing the work.

## Decision (owner, 2026-07-30): KEEP

Ruby has `Range` as a core type and Rails supports PostgreSQL range **column**
types first-class. trails wants range support to be first-class too, and
creating a custom range type is part of that — even though JavaScript has no
native range analogue, which is precisely why the helper has to be explicit here
where Ruby can lean on the language.

So this is NOT the fidelity-first delete case. The helpers stay; what has to
change is the justification, which currently says only "Rails has no
equivalent" — accurate but not a reason.

The story title is now a misnomer; the work is to re-reason, not to delete.

## Acceptance criteria

- `createRange` / `dropRange` stay. Their `@noRailsEquivalent` reasons are
  rewritten at the declaration sites
  (`connection-adapters/postgresql-adapter.ts:4301` and `:4318`, plus the
  implementations in `connection-adapters/postgresql/schema-statements-class.ts`)
  to state the requirement above: trails supports PG range types as a
  first-class feature, and unlike Ruby it has no language-level Range to lean
  on, so the DDL helper is deliberate trails surface.
- The reason names Rails' enum quartet (`postgresql_adapter.rb:541` `create_enum`,
  `:571` `drop_enum`, `rename_enum`, `rename_enum_value`, stubbed on the base at
  `abstract_adapter.rb:576-580`) as the shape it is modelled on, so the next
  audit sees a considered decision rather than an unexamined tag.
- If the RFC 0080 story `detect-no-rails-equivalent-tags-excusing-convergeable-surface`
  lands a permanence-classification token first, use it — this is a PERMANENT
  deviation, not deferred work.
- No behavior change, no test changes, no allowlist entry.
- `pnpm parity:api:extra --package activerecord` reports no stale tags.
