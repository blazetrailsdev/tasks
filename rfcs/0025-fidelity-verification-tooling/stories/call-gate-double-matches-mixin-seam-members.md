---
title: "Call-set gate double-matches mixin-seam members against their module file"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by precise-call-pairing-key-for-owner-static-and-accessor (2026-08-17 sweep): all five are one root cause — the <package,tsFile,rubyName> row key cannot name the member on either side. Every citation and baselined row from this story is carried into that body as an acceptance criterion."
---

# Call-set gate double-matches mixin-seam members against their module file

## Context

Rails houses several PG methods in included modules —
`PostgreSQL::Quoting#quoted_date` (`postgresql/quoting.rb:143`),
`#quoted_binary` (`:152`), `#lookup_cast_type_from_column` (`:189`),
`PostgreSQL::DatabaseStatements#returning_column_values`
(`postgresql/database_statements.rb:208`),
`ReferentialIntegrity#disable_referential_integrity`
(`postgresql/referential_integrity.rb:7`).

trails ports each body into the matching module file
(`connection-adapters/postgresql/{quoting,database-statements,referential-integrity}.ts`),
where it makes the calls Rails makes and compares **green**. But
`PostgreSQLAdapter` also carries a delegating member at the same name — the
`this`-typed-function / include seam CLAUDE.md prescribes — and the compare tool
matches the Ruby module method a _second_ time against that adapter member,
which of course makes none of the calls.

Result: five `kind: "set"` rows in
`call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
that are pure tooling artifacts. PR #6581 gave each a specific reason, but a
reason is the wrong instrument — nothing about the port is wrong, and the rows
can never be converged by editing the adapter. They inflate the shard's row
count, which RFC 0084 defines as the debt metric.

This is not PG-specific: any adapter that mixes in a Rails module and keeps a
seam member at the same name will produce the same duplicates.

## Converged shape

- When a Ruby method matches both a module file and a class member that only
  delegates to it, the gate credits the module-file match and does not emit a
  second mismatch against the seam. (`scripts/api-compare/` — the same
  resolution `parity:api` already has to make for mixin members.)
- The five artifact rows are deleted from the PG shard, and any equivalent rows
  in sibling adapter shards are swept in the same pass.
- Add a fixture covering "module file green + delegating seam member" so the
  behavior is pinned.

## Acceptance criteria

- [ ] No `kind: "set"` row survives solely because a delegating seam member
      duplicates a module-file match.
- [ ] The five PG rows named above are deleted; shard row count falls by five;
      marks tightened, exclude tree not reseeded.
- [ ] `pnpm parity:api:calls` green, and a scripts-side test pins the new
      resolution.
- [ ] No genuine mismatch is newly suppressed — verify the total in-scope count
      falls by exactly the artifact rows removed.
