---
title: "Port HashWithIndifferentAccess's 28 missing in-closure members"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6568
claim: "2026-08-15T15:45:07Z"
assignee: "insert-all-touch-timestamps-trailing-comma"
blocked-by: null
closed-reason: null
---

# Port HashWithIndifferentAccess's 28 missing in-closure members

## Context

Measured 2026-08-14 with a full `pnpm build` + `pnpm parity:api`
(`scripts/api-compare/output/api-comparison.json`, filtered through
`output/ar-closure.json`): the AR closure sits at 8817/8985 members (98.1%),
and in-closure `activesupport` at **948/1115**. `hash_with_indifferent_access.rb`
is the single largest hole in it — **27 missing members**, plus
`core_ext/hash/indifferent_access.rb`'s `Hash#nested_under_indifferent_access`,
28 in total. Nothing in RFC 0098's ledger has ever covered this file.

Missing (Rails `activesupport/lib/active_support/hash_with_indifferent_access.rb`):

`nested_under_indifferent_access` (:66), `regular_writer`, `regular_update`,
`merge!`, `key?`, `include?`, `has_key?`, `member?`, `fetch` (:195),
`default`, `values_at`, `fetch_values` (:251), `reverse_merge`,
`with_defaults`, `reverse_merge!`, `with_defaults!`, `to_options`,
`deep_symbolize_keys`, `to_options!`, `transform_keys!`, `slice!`,
`to_proc` (:383), `convert_key` (:388), `convert_value` (:392),
`convert_value_to_hash` (:405), `set_defaults`,
`update_with_single_argument` (:424).

trails: `packages/activesupport/src/hash-with-indifferent-access.ts` (456
lines). The ported half is real — `merge`, `update`, `deepMerge`, `slice`,
`except`, `transformKeys`, the enumerable arm — so this is a completion, not a
from-scratch port.

**Read before scoping:** the existing class is shaped like a JS `Map`, not like
Rails' Hash — `get(key)` / `set(key, value)` / `has(key)` / `get size()`
(:40-62). Rails has `[]`, `[]=`, `key?` and `size`. That is why `key?`,
`include?`, `has_key?` and `member?` all read as missing: the aliases have no
receiver to hang off. Decide the receiver shape first, because
`convert_key`/`convert_value` — the mechanism the whole class is built on, and
both missing — have to land on it. Converging the receiver may retire several
of the 28 rows at once and is likely the cheapest ordering.

Some members may resolve as `SKIP_GROUPS` rather than ports (`to_proc` needs a
Ruby block receiver). That is allowed by the RFC's "Done means" — but each one
costs a reason in `scripts/parity/conventions.ts`, not a silent omission.

## Acceptance criteria

- [ ] The receiver-shape question above is settled and stated in the PR: either
      the class converges onto Rails' `[]`/`[]=`/`key?` spelling per
      `docs/ruby-ts-conventions.md`, or the Map shape is kept with the reason
      recorded at the class.
- [ ] `hash_with_indifferent_access.rb` and `core_ext/hash/indifferent_access.rb`
      report **0 missing members** in `pnpm parity:api`, or the residue carries
      `SKIP_GROUPS` entries with reasons.
- [ ] `convert_key` / `convert_value` / `convert_value_to_hash` are real ports
      of :388-405, and the already-ported methods route through them rather than
      keeping any inline key coercion.
- [ ] No new `parity:api:extra` surface; no new call-mismatch baseline rows.
- [ ] In-closure activesupport member count rises by ~28 from the 948/1115
      measured on 2026-08-14.

## Notes

May exceed one PR. If so, split by member group (converters + readers first,
then the merge/defaults family, then the bang forms) and file each as its own
story — do not fan out PRs from one claim.
