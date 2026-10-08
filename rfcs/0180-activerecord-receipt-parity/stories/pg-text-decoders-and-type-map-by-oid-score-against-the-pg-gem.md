---
title: "activerecord: the PG text decoders and TypeMapByOid score against the pg gem"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps:
  - pg-gem-result-and-array-coders-score-against-the-pg-gem
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8686 added `packages/activerecord/src/connection-adapters/postgresql/pg-text-decoder.ts` while
`pg-gem-result-and-array-coders-score-against-the-pg-gem` (trails PR 8690) was in flight, and tagged its 29
members `@noRailsEquivalent CONVERGEABLE` onto that story. That story's scope was the 17 receipts it
listed (`PG::Result` and the two array coders), so these are re-tagged onto this one.

They are the pg gem's, and PR 8690 made the gem scoreable: `pg` is vendored at `vendor/pg/v1.5.9`, enrolled
as the api-compare pseudo-package rooted at `packages/activerecord/src/pg/`, and `extract-ruby-api.rb`
reads its C method tables (`C_EXTENSION_DIRS`). So each of these pairs once it sits at its gem path under
the gem's name:

- `PGSimpleDecoder` (`oid`, `name`, `constructor`, `toH`, `decode`) is `PG::SimpleDecoder` <
  `PG::SimpleCoder` < `PG::Coder` (`vendor/pg/v1.5.9/ext/pg_coder.c:567-601`, `lib/pg/coder.rb:16-47`).
  `packages/activerecord/src/pg/coder.ts` already holds `Coder` with `initialize`, `name` and `flags`;
  `oid` (`pg_coder.c:569-570`) and `to_h` (`coder.rb:30-38`) belong there.
- `PGTextDecoder.Integer`, `Float`, `Numeric`, `Boolean`, `Bytea` are `PG::TextDecoder::*`, defined by
  `pg_define_coder` (`ext/pg_text_decoder.c:984-1010`). `Date` is `lib/pg/text_decoder/date.rb`, and the
  three timestamp decoders are `lib/pg/text_decoder/timestamp.rb`.
- `PGTypeMapByOid` (`coders`, `defaultTypeMap`, `addCoder`) is `PG::TypeMapByOid`
  (`ext/pg_type_map_by_oid.c`, `add_coder`, `coders`) with `PG::TypeMap::DefaultTypeMappable`
  (`ext/pg_type_map.c`, `default_type_map=`).

## Acceptance criteria

- [ ] The classes live under `packages/activerecord/src/pg/` at the paths `parity:api` pairs them at, and
      carry the gem's names (`PG.SimpleDecoder`, `PG.TextDecoder.Integer`, `PG.TypeMapByOid`).
- [ ] `oid` and `to_h` are on `Coder`; the decoders extend `SimpleDecoder` and take the gem's
      `decode(string, tuple, field)`.
- [ ] No `@noRailsEquivalent` receipt remains in `pg-text-decoder.ts`, and the file is gone.
- [ ] `pnpm parity:api:extra --package pg` lists none of these names.

## Verification

```bash
pnpm parity:api:extra --package pg && pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
