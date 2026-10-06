---
title: "activerecord: PG::Result and the PG array coders score against the pg gem"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit: the 17 receipts below were
`@noRailsEquivalent PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged
`CONVERGEABLE` onto this story.

They are not names Rails lacks. They are the `pg` gem's, which Rails calls directly:

- `packages/activerecord/src/connection-adapters/postgresql/pg-result.ts` — `PGResult` and its
  `[Symbol.species]`, `constructor`, `fields`, `values`, `ntuples`, `getvalue`, `ftype`, `fmod`,
  `cmdTuples`, `clear` (11). This is `PG::Result`, read at
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:172-190`
  (`result.fields`, `result.ftype i`, `result.fmod i`, `result.values`, `result.cmd_tuples`) and
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1080`
  (`result.getvalue(0, 0)`).
- `packages/activerecord/src/connection-adapters/postgresql/oid/array.ts` — `PgTextEncoderArray`
  (`name`, `encode`) and `PgTextDecoderArray` (`name`, `decode`) (6). These are
  `PG::TextEncoder::Array` / `PG::TextDecoder::Array`, built at
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb:19-20`.

The `pg` gem is not vendored (`vendor/sources.ts` has `sqlite3` and no `pg`), and both classes are
defined in its C extension, so `parity:api:extra` has no Ruby side to pair these members with and scores
each one novel. ruby-compat has the same shape — MRI C surface — and a README rule that makes its
`PERMANENT` receipts inventory; activerecord has no such rule, so here the tag claimed a ratification that
does not exist.

`PGResult` also carries members the gem class does not (`[Symbol.species]`, an `Array` superclass holding
the row hashes) and class names the gem does not use (`PgTextEncoderArray` for `PG::TextEncoder::Array`).

## Acceptance criteria

- [ ] The gem surface is scored against the gem: `pg` is a vendored source at the version
      `vendor/rails/v8.0.2/Gemfile.lock:412` resolves (`pg (1.5.9)`), and the members above pair with `PG::Result`,
      `PG::TextEncoder::Array` and `PG::TextDecoder::Array` — or, if the comparator cannot read a C
      method table, the classes move to a home whose rule covers gem C surface. Either way no
      `@noRailsEquivalent` receipt remains on a member the gem defines.
- [ ] The classes carry the gem's names (`PG.Result`, `PG.TextEncoder.Array`, `PG.TextDecoder.Array`).
- [ ] A member the gem class does not define (`[Symbol.species]`, the `Array` superclass) is removed, or
      split into its own story with the reason it cannot be.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green; no mark or baseline widened.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
