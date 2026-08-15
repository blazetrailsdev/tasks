---
title: "Converge activesupport's 31 non-constructor call-argument rows"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6553
claim: "2026-08-15T00:15:05Z"
assignee: "converge-activesupport-non-constructor-argument-rows"
blocked-by: null
closed-reason: null
---

# Converge activesupport's 31 non-constructor call-argument rows

## Context

Measured 2026-08-14 over `scripts/api-compare/call-mismatches-exclude/**`
(`kind: "args"`). RFC 0099 has **89 rows left of the 490 it was chartered on**
(82% burned, 104 done stories). This story is one of three that together
account for all 89; landing the three puts the RFC in reach of its exit.

These are the 31 activesupport rows whose call is **not** `new` — the
constructor cluster is its own story
(`converge-constructor-argument-rows`), and the 22 non-activesupport
non-constructor rows are `converge-ar-and-model-non-constructor-argument-rows`.

- `activesupport/encrypted-file.ts` (5): decrypt -> encryptor; encrypt -> check_key_length; encrypt -> encryptor; read -> decrypt; write -> encrypt
- `activesupport/number-helper/number-to-human-size-converter.ts` (5): convert -> exponent; convert -> smaller_than_base?; convert -> unit; exponent -> log; smaller_than_base? -> abs
- `activesupport/cache/file-store.ts` (4): file_path_key -> decode_www_form_component; file_path_key -> split; modify_value -> write_entry; search_dir -> directory?
- `activesupport/hash-utils.ts` (4): deep_stringify_keys -> deep_transform_keys; deep_stringify_keys! -> deep_transform_keys!; deep_symbolize_keys! -> deep_transform_keys!; reverse_merge! -> reverse_merge
- `activesupport/number-helper/number-to-human-converter.ts` (3): calculate_exponent -> floor; convert -> calculate_exponent; convert -> determine_unit
- `activesupport/messages/metadata.ts` (2): deserialize_from_json_safe_string -> decode; serialize_to_json_safe_string -> encode
- `activesupport/module-ext.ts` (2): module_parent -> module_parent_name; module_parents -> module_parent_name
- `activesupport/testing/time-helpers.ts` (2): travel_to -> stub_object; travel_to -> stubbing
- `activesupport/time-with-zone.ts` (2): to_fs -> strftime; to_s -> formatted_offset
- `activesupport/current-attributes.ts` (1): reset -> run_callbacks
- `activesupport/messages/rotation-coordinator.ts` (1): build_with_rotations -> uniq
  Every row still carries the seeded RFC 0095 reason ("pending per-body
  convergence review"), so none has been reviewed.

Two sub-patterns are worth naming up front, because they change what "converge"
means:

- **`number-helper/*` (8 rows across the two human-size/human converters)** is
  the densest pocket and looks like one body ported with a different internal
  decomposition — `convert -> exponent`, `convert -> unit`,
  `convert -> calculate_exponent`, `convert -> determine_unit`. Check whether
  the helpers were inlined or renamed before treating these as argument
  divergences; if the decomposition itself diverges, that is a
  `parity:api:calls` (set) concern for RFC 0084, not an args fix, and the row
  should be retargeted rather than force-fitted here.
- **`hash-utils.ts` (4 rows)** is the `deep_transform_keys` family. Rails'
  `deep_stringify_keys` is literally `deep_transform_keys(&:to_s)`; a block
  argument that trails passes differently is a Ruby-block idiom question with a
  settled trails answer — use it rather than inventing a new shape.

`encrypted-file.ts` (5) additionally has one `-> new` row that belongs to the
constructor story; do not double-count it.

## Acceptance criteria

- [ ] Each of the 31 rows is deleted (the TS call passes what Rails passes) or
      carries a reviewed, row-specific reason replacing the RFC 0095 seed.
- [ ] Any row that is really a call-**set** divergence (a renamed or inlined
      helper, per the number-helper note) is retargeted to RFC 0084 with a
      filed story rather than baselined here under an args reason.
- [ ] `pnpm parity:api:calls:args` green; AR-closure args row count moves down
      from 89 and does not rise.
- [ ] Converged rows deleted by hand from their shard; stale high-water marks
      fixed with `pnpm parity:api:calls:tighten <shard>` — no `--write`, no
      reseed.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new surface.

## Notes

Split suggestion if it exceeds the LOC ceiling: (a) number-helper ×8, (b)
encrypted-file + messages ×8, (c) the rest.
