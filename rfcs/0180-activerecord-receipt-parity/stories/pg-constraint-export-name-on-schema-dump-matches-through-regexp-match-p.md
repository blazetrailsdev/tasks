---
title: "activerecord: PostgreSQL constraint export_name_on_schema_dump? matches through the stateless Regexp#match?"
status: in-progress
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: ["export-name-on-schema-dump-matches-through-a-stateless-regexp-match-p"]
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8679
claim: "2026-10-08T13:34:16Z"
assignee: "generated-relation-methods-mutex-synchronize-is-unported"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit (trails#8390). The PostgreSQL
twins of the two bodies `export-name-on-schema-dump-matches-through-a-stateless-regexp-match-p` owns:

`ExclusionConstraintDefinition#export_name_on_schema_dump?` and
`UniqueConstraintDefinition#export_name_on_schema_dump?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:209-211,231-233`):

```ruby
def export_name_on_schema_dump?
  !ActiveRecord::SchemaDumper.excl_ignore_pattern.match?(name) if name
end
```

`packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts` writes
`this.name.search(SchemaDumper.exclIgnorePattern) === -1` in both, each under
`@missingRailsCall match? — CONVERGEABLE <this story>`.

The audit tried `RegExp#test`, the gate's analogue for `match?`. A bare `test` reds
`schema-definitions.trails.test.ts` "exportNameOnSchemaDump is stable across repeated calls", because the
pattern is a user-settable `cattr_accessor` and `test` on a `g`-flagged pattern advances `lastIndex`.
Resetting `lastIndex = 0` first passes, but writes to a regex every caller shares, which Ruby's
`Regexp#match?` (`vendor/ruby/v3.3.11/re.c:3811` `rb_reg_match_p`) never does. `String#search` is the one
JS form that leaves the pattern as it found it.

The dependency adds the ruby-compat `Regexp#match?` export; this story is the two call sites.

## Acceptance criteria

- [ ] Both bodies are `!match?(pattern, name) if name` through the ruby-compat export the dependency adds.
- [ ] Both `@missingRailsCall match?` receipts are deleted; `pnpm parity:api:calls` green with no new row.
- [ ] `schema-definitions.trails.test.ts`'s `g`-flagged cases still pass.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/postgresql/schema-definitions.trails.test.ts
```
