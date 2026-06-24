---
title: "Query methods call checkIfMethodHasArgumentsBang (empty-arg guard + flatten/compact)"
status: ready
updated: 2026-06-24
rfc: "0047-widen-call-set-parity-all-ported"
cluster: real-omission
deps:
  - wide-call-set-significant-knob-and-baseline
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' query methods guard against empty arguments via
`check_if_method_has_arguments!`, which raises `ArgumentError` on blank args and
otherwise runs `args.flatten!` + `args.compact_blank!`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:250-251`
for `includes`, and the call recurs at lines 291, 322-323, 356, 413/422, 495,
519, 542, 574, 594, 657, 753, 807 for `eager_load`, `preload`, `references`,
`select`, `reselect`, `group`, `regroup`, `order`, `reorder`, `unscope`,
`joins`, `left_outer_joins`, `optimizer_hints`, `annotate`). Definition:
`query_methods.rb` `def check_if_method_has_arguments!(method_name, args,
message = nil)`.

trails ports this as `checkIfMethodHasArgumentsBang`, **defined and exported**
at `packages/activerecord/src/relation/query-methods.ts:1618` — but a
package-wide grep confirms it is **never called** (only the definition at 1618
and the export note at 1582). So every public query method skips both:

1. the empty-argument `ArgumentError` (`includes()` with no args silently
   no-ops in trails where Rails raises), and
2. the `flatten!` / `compact_blank!` normalization Rails performs on the args.

Wide call-set flag (missing call `check_if_method_has_arguments!`) fires on all
~17 of these methods in `relation/query-methods.ts` (and the re-export surface
in `relation.ts`).

## Acceptance criteria

- The public query methods listed above call `checkIfMethodHasArgumentsBang`
  (or its faithful equivalent) at entry, matching Rails' raise-on-blank and
  `flatten!` / `compact_blank!` normalization semantics, including the custom
  message for `select` ("Call `select' with at least one field.").
- Tests asserting `ArgumentError` (the trails equivalent) on the no-arg form,
  named to match the corresponding Rails tests (`test:compare` fidelity) — read
  the Rails tests first.
- The wide call-mismatches artifact no longer flags
  `check_if_method_has_arguments!` for these pairs.
- File scope stays within `relation/query-methods.ts` (+ tests); no overlap
  with in-flight 0044/0045 query-methods stories — check `pnpm tasks list`
  before claiming.

## Out of scope

- The `!`-suffixed internal variants (`includes!` etc.) — Rails does not guard
  those.
