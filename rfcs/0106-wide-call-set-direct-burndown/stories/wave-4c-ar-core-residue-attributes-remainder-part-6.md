---
title: "wave-4c-ar-core-residue-attributes-remainder-part-6"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
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

# Wave 4c-b remainder, part 6: the `store.json` + `enum.json` call-set rows (15 rows)

## Context

Split out of `wave-4c-ar-core-residue-attributes-remainder-part-3`, whose
context flagged these two as "the two shards with real bodies to converge
(`store_accessor`'s dirty-tracking delegations, `_enum`'s `define_method`
generation)". They did not fit that PR's LOC ceiling.

`scripts/api-compare/call-mismatches-exclude/activerecord/store.json`

    read            -> prepare
    store           -> serialize
    store_accessor  -> attribute_changed?
    store_accessor  -> local_stored_attributes
    store_accessor  -> order:readStoreAttribute,writeStoreAttribute
    store_accessor  -> saved_change_to_attribute?
    store_accessor  -> saved_changes
    stored_attributes -> local_stored_attributes

Rails source: `vendor/rails/activerecord/lib/active_record/store.rb`
(`store` 106-110, `store_accessor` 112-…, `stored_attributes` 199-205,
`HashAccessor.read/write/prepare` 227-241).

`scripts/api-compare/call-mismatches-exclude/activerecord/enum.json`

    _enum                 -> define_method
    _enum_methods_module  -> include
    define_enum_methods   -> define_method
    detect_enum_conflict! -> dangerous_attribute_method?
    detect_enum_conflict! -> method_defined_within?
    serializable?         -> fetch
    serialize             -> fetch

Rails source: `vendor/rails/activerecord/lib/active_record/enum.rb`.

Note the two `fetch` rows: Ruby `Hash#fetch` returns the STORED value
whenever the key exists (including a stored `nil`/`false`), where `??`
substitutes on nullish — read CLAUDE.md's "`fetch` vs `??`" trap before
deciding whether those two are equivalent or a real gap.

## Acceptance criteria

- [ ] Every row above is either converged (verified against the Rails source
      line) or leaves as a reviewed one-line per-site reason / a
      `@missingRailsCall` tag at the call site.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/store.json` /
      `activerecord/enum.json`. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Split into two PRs if the two shards together exceed the LOC ceiling.
