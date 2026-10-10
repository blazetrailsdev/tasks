---
title: "body-pins-cover-only-the-first-def-of-a-multiply-defined-name"
status: draft
updated: 2026-10-10
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

A body pin is keyed by `(package, rubyFile, rubyName)` (`scripts/api-compare/body-pins.ts`, `keyOf`), and
`compare.ts` feeds it a first-sighting digest per name (`rubyBodyDigestByName`, the
"First-sighting Ruby body digest per name" map; `currentDigests` in `body-pins.ts` then collapses
duplicate records to the first). A Ruby file that defines one name in several classes or modules
therefore gets ONE pin, digesting only the first def in file order. Upstream drift in any later def
is invisible to `pnpm parity:api:pins`.

`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/compatibility.rb` is the worst case
(found on trails#8756): `add_column` is defined at `:100` (V7_0), `:179` (V6_1) and `:392` (V5_0),
and the one pin (`1f8f45959c0c57ee`) is the V7_0 body. Likewise `change_column` x3, `create_table` x3,
`add_reference` x4, `column` x4, `references` x3, `change` x2, `timestamps` x2, `add_timestamps` x2,
`raise_on_if_exist_options` x5, `compatible_table_definition` x6. The file has 34 pins for 67 defs.

`compare.ts` already keeps a second population keyed by (declaring class, name) for skeletons
(`rubySkeletonByOwnerName`), because "one Ruby FILE can declare a name twice, and first-sighting
keying then hands the first one's body to BOTH matched pairs". Body digests have no such keying.

## Acceptance criteria

- [ ] `output/body-hashes.json` carries one record per (rubyFile, declaring class/module, rubyName),
      and `body-pins.json` keys on the same grain, so every def of a multiply-defined name is pinned
      and drift-checked on its own.
- [ ] Existing single-def pins keep their digest and `reason` across the re-key (no drift, no mass
      rewrite beyond the added owner field).
- [ ] `migration/compatibility.rb` pins every def (67), each with `reason`
      `activerecord-verify-and-pin-migration-compatibility` (all were verified by hand on trails#8756).
- [ ] `scripts/api-compare/body-pins.test.ts` covers a file defining one name in two classes with
      different bodies: drift in the second is reported.

## Verification

```bash
API_COMPARE_FORCE=1 pnpm parity:api && pnpm parity:api:pins
pnpm vitest run scripts/api-compare/body-pins.test.ts
```
