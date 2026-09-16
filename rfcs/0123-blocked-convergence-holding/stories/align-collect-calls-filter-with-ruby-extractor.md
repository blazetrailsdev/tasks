---
title: "collectCalls records _private()/Klass() names the Ruby extractor drops"
status: blocked
updated: 2026-08-27
rfc: "0123-blocked-convergence-holding"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: "The filter does not only delete call-set entries: `calls` is also the edge set reachedSameFileMethods/SAME_FILE_CLOSURE_DEPTH walks (compare.ts:538-585), so dropping `_`-prefixed names severs every this._helper() closure edge. Measured with the filter applied: 92 NEW call-mismatch rows (44 STALE), and the NEW rows are closure false positives, not divergences — e.g. activemodel callbacks.ts _define_after_model_callback/new, actioncontroller metal/strong-parameters.ts convert_value_to_parameters/new, activerecord type/type-map.ts perform_fetch/call. Landing AC1 as written means baselining ~92 rows wholesale. Needs a companion design that keeps the closure sound: apply the filter in compare.ts after the same-file closure is computed, or emit closure edges separately from the compared call set."
closed-reason: null
---

> Re-filed from RFC 0084 on 2026-08-14 when 0084 was superseded by RFC 0106
> (direct burndown).

## Context

`callSiteName` (`scripts/api-compare/extract-ts-api.ts:4543-4557`) applies the
Ruby extractor's name filter. `extract-ruby-api.rb`'s `call_site_name` drops any
name that starts with `_` or with anything other than a lowercase letter, so the
`callArgs` stream cannot manufacture TS-only sites.

`collectCalls` (`extract-ts-api.ts:4725`), which feeds `calls` / `callSeq`, does
not apply that filter. It records `this._privateHelper()` and `Klass(...)` as
call names. Ruby never emits those, so each one is a TS-only entry in the call
set that can never pair.

**Why the filter cannot go in `collectCalls`.** `calls` is also the edge set that
the same-file closure walks. `compare.ts:4077-4083` passes the unfiltered
`own.calls` to `reachedSameFileMethods` (`compare.ts:985`, depth
`SAME_FILE_CLOSURE_DEPTH` at `:936`), and `effectiveTsCalls` (`:1050-1066`)
merges the reached helpers' calls. A `this._helper()` edge is how a body gets
credited with its extracted helper's calls. Filtering at extraction was measured
to sever those edges: 92 new call-mismatch rows (44 stale), all of them closure
false positives. Examples: activemodel `callbacks.ts`
`_define_after_model_callback/new` and activerecord `type/type-map.ts`
`perform_fetch/call`.

The first design in this story's history cited `compare.ts:538-585`. The closure
has since moved to the lines above.

## Acceptance criteria

1. The closure walks the unfiltered edges. `reachedSameFileMethods` and
   `effectiveTsCalls` still see `_`-prefixed and capitalised names.
2. The `_`-prefix / non-lowercase filter is applied to the compared set only:
   the `tsCalls` handed to `significantMissingCalls` in `compare.ts`, after the
   closure is computed. It shares one predicate with `callSiteName` and cites the
   Ruby guard.
3. The `parity:api:calls` artifact is regenerated and the row movement is
   reported in the PR. The PR adds no new closure false-positive rows. Stale
   baseline rows for dropped names are deleted by hand (only-shrink, no `--write`
   reseed).
4. Tests pin that `this._helper()` and `Klass()` are not credited in the compared
   set but are still walked by the closure, and that `constructor` and `super`
   are still credited.
