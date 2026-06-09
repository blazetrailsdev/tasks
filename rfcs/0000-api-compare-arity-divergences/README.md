---
rfc: "0000-api-compare-arity-divergences"
title: "Close the genuine api:compare arity divergences — fix the code, document the noise"
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: "@dmarano"
packages:
  - activerecord
  - actiondispatch
  - actionview
clusters:
  - api-compare-arity-divergences
related-rfcs:
  - "0000-arel-collector-threading"
  - "0005-activerecord-gaps"
---

<!-- Unnumbered until merge: keep `rfc:` as 0000-api-compare-arity-divergences and
     the H1 below number-free. `scripts/finalize-rfc.mjs` assigns the number at
     merge. Sibling RFC 0000-arel-collector-threading clears the 132 arel
     `visit_*(o, collector)` arity mismatches as a *side-effect* of a fidelity
     refactor; THIS RFC owns the non-arel residual — the handful of genuine
     code-level signature divergences hiding in it. -->

# RFC — Close the genuine api:compare arity divergences

## Summary

`api:compare` runs an **advisory** arity check: after pairing Ruby↔TS methods by
name, it compares their positional-arg _ranges_ and flags pairs whose ranges
don't overlap. It never affects the parity %. As of this RFC there are **303**
arity mismatches across all packages (95.7% match). PR #3045 audited the entire
list, broadened the matcher's convention-stripping (477 → 303), and concluded
that **~95% of the residual is convention noise, not code bugs**: the port's
`this`-mixin convention spells receivers positionally, Ruby `&block`s become
explicit `fn`/`callback` params, Ruby instance state read from `@ivar`s becomes
explicit positional args, kwargs collapse to a single options object, and the
Ruby/TS extractors miss aliases and `**`-splats.

Of the 303, **132 are the arel `visit_*(o, collector)` visitor methods** owned by
the sibling RFC [0000-arel-collector-threading](../0000-arel-collector-threading/README.md),
which clears them as a side-effect of a structural-fidelity refactor. That leaves
a **171-mismatch non-arel residual**. This RFC triages those 171 to a definitive
ledger, **fixes the small set that are genuine code divergences** (chiefly:
`_insert_record` drops Rails' `returning` argument, so the port has no
RETURNING-clause path on INSERT), and **records the convention-noise remainder as
permanently expected** so future audits don't re-litigate it.

This RFC does **not** change the arity heuristic and does **not** propose making
it enforcing — per design decision it stays advisory. It also does **not** rewrite
faithful ports to match Ruby's arity: doing so (e.g. stuffing positional state
back into instance ivars) would make the port _less_ faithful, the opposite of
what `api:compare` exists to measure.

## Motivation

### The arity check, and why most mismatches are not bugs

`arity` (added in PR #2989, broadened in #3045) pairs methods by name and checks
that the Ruby and TS positional-arg ranges **overlap** (not match exactly). It is
advisory: a one-line summary prints and `output/arity-mismatches.json` is always
written, but the parity % is untouched (`scripts/api-compare/compare.ts:118`,
`scripts/api-compare/arity.ts:1`).

The matcher already absorbs the port's documented conventions
(`scripts/api-compare/arity.ts`): it strips a leading `this:`/host/`*Class`
receiver and a trailing ported `&block`, and grants kwargs/`**opts` one extra
max-slot of slack. Each strip is tried only as an _additional_ candidate form, so
it can only ever gain a match, never manufacture one. #3045 widened these strips
and cut the count from 477 to 303 — the remaining mismatches are the ones no
_safe_ convention strip can absorb.

The crucial point, established by #3045's full audit: **driving the count to zero
by editing application code would be anti-fidelity.** The dominant residual
pattern is "Ruby reads `@ivar` instance state; the TS port — following the
stateless-helper / `this`-mixin convention in `CLAUDE.md` — receives that state as
an explicit positional arg." Examples:

| Ruby (reads ivar)      | TS (state passed in)                              |
| ---------------------- | ------------------------------------------------- |
| `referenced_columns()` | `referencedColumns(predicates)`                   |
| `unique_records()`     | `uniqueRecords(recs)`                             |
| `default_row_format()` | `defaultRowFormat(isMariaDb, databaseVersion, …)` |
| `current_tags()`       | `currentTags(tagStack)`                           |

Rewriting these to take zero args (re-introducing hidden mutable state) to satisfy
an advisory metric would directly contradict the port methodology. So the
resolution is **not** "make the number zero" — it is "make the number _honest_":
fix the genuine code divergences, and document the rest as the expected cost of
the port's conventions.

### What's actually in the 171-mismatch residual

Categorizing every non-arel mismatch (full ledger is the deliverable of
[`stories/s3-document-residual.md`](stories/s3-document-residual.md)):

| Bucket                                                                                                                                                                                      | ~Count | Code bug?                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------- |
| **ivar-state → explicit positional arg** (`referencedColumns(predicates)`, `defaultRowFormat(…)`, `currentTags(tagStack)`)                                                                  | ~80    | No — `this`-mixin convention       |
| **kwargs → single options object** (`rateLimiting(args)`, `servedBy(options)`, `digest({…})`, `report(opts)`)                                                                               | ~25    | No — convention                    |
| **leading/extra receiver** spelled positionally (`indexErrorsSetting(err)`, `clearHelpers(cls)`, `isAnyAuthenticityTokenValid(c)`)                                                          | ~25    | No — convention                    |
| **trailing `&block`/callback** ported as an explicit param (`__updateCallbacks(name, targets, fn)`, `addByFilePath(filePath, readFile)`)                                                    | ~15    | No — convention                    |
| **Ruby-side extractor miss** (`**`-splat / alias / delegation read as `()`: `validatesSizeOf`, `hasKey`, `recognizePathWithRequest(****)`)                                                  | ~15    | No — Ruby extractor                |
| **structural / candidate-pool artifact** (`Callbacks.build` has 3 overloaded factories; `missing_attribute` drops Ruby's explicit-backtrace `stack`; `read_data` drops the reused `outbuf`) | ~8     | No — by design / native equivalent |
| **GENUINE code divergence** (port drops a behavioral param it should thread)                                                                                                                | **~3** | **Yes**                            |

**~98% of the residual is not a code bug.** The genuine handful is what this RFC
fixes.

### The genuine divergences

A _genuine_ divergence is one where the TS signature drops a parameter that
carries behavior Rails depends on — not a receiver, not ivar-state, not a block,
not a native-equivalent (JS captures stack traces automatically; JS doesn't reuse
output buffers). The triage (Design, below) confirms each against both sources.

The flagship is **`_insert_record`**:

```ruby
# vendor/rails/activerecord/lib/active_record/persistence.rb:238
def _insert_record(connection, values, returning)
  # … prefetch primary key …
  connection.insert(im, "#{self} Create", primary_key || false,
                    primary_key_value, returning: returning)
end
```

```ts
// packages/activerecord/src/persistence.ts:208
export async function _insertRecord(
  this: PersistenceHost,
  connection: { insert?(arel, …): Promise<unknown>; … },
  values: Record<string, unknown>,
): Promise<unknown> {
  // … builds InsertManager, calls connection.insert(im) — no returning, no
  //     name, no primary_key, no primary_key_value, no prefetch …
}
```

The port drops `returning` entirely (and with it the `name`/`primary_key`/
`primary_key_value` insert args and the `prefetch_primary_key?` path). Rails uses
`returning` to fetch DB-generated columns on INSERT (`RETURNING` on PostgreSQL;
the generated id and computed defaults elsewhere) — see the caller at
`persistence.rb:924`, which first calls `_returning_columns_for_insert(connection)`
(the port's `_returningColumnsForInsert()` drops its `connection` arg too). This
is a real feature gap, not a convention.

The other genuine candidates are scoped in
[`s2-genuine-divergences`](stories/s2-genuine-divergences.md) and
confirmed-or-reclassified there before any code is touched.

## Design

### Triage methodology

For each of the 171 non-arel mismatches, classify into exactly one bucket by
reading **both** sources (Rails `vendor/rails/**` and the TS port) — never the
signature alone:

1. **Receiver / `this`-mixin** — the extra/leading TS param is the `self` the Ruby
   method ran against (a host type, `*Class`, `_`-placeholder, or a conventional
   receiver name). Already half-absorbed by the matcher; the residual here is
   names the strip-list deliberately excludes (genuine-looking value args).
2. **ivar-state → positional** — Ruby reads `@x`; TS threads `x` in. Confirmed by
   finding the `@x` read in the Ruby body. **Convention — do not "fix".**
3. **kwargs → options object** — Ruby keyword args collapsed to one TS object.
4. **trailing block/callback** — Ruby `&block`/bare `yield` ported as `fn`.
5. **Ruby-side extractor miss** — `**`-splat, alias, or delegation the Ruby
   extractor recorded as the wrong arity. A tooling limitation, out of scope here
   (noted, not fixed — heuristic stays as-is).
6. **structural / native-equivalent** — overloaded factory the matcher pairs
   against the wrong candidate; or a param with a JS-native equivalent (auto stack
   trace, GC'd buffers). Documented, not fixed.
7. **GENUINE** — a behavioral param the port should thread but doesn't. **Fix.**

The full per-method verdict table is the deliverable of
[`s3-document-residual`](stories/s3-document-residual.md); it lives in
`scripts/api-compare/` as prose (no heuristic code change) so a future audit reads
the verdict instead of re-deriving it.

### The genuine ledger (current best triage)

| Method                          | Ruby                                 | TS                              | Verdict                                                                                                                 | Story |
| ------------------------------- | ------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----- |
| `_insert_record`                | `(connection, values, returning)`    | `(connection, values)`          | **Genuine** — drops `returning` + prefetch/name/pk threading                                                            | s1    |
| `_returning_columns_for_insert` | `(connection)`                       | `()`                            | **Genuine** — pair of the above                                                                                         | s1    |
| `get_chain`                     | `(reflection, association, tracker)` | `(reflection, tracker)`         | Candidate — `RuntimeReflection.new(reflection, association)` needs `association`; confirm the port doesn't re-derive it | s2    |
| `render_exception`              | `(request, exception, wrapper)`      | `(env, exception)`              | Candidate — drops `wrapper`; confirm it isn't rebuilt internally                                                        | s2    |
| `partial_path`                  | `(object, view)`                     | `(object, view, contextPrefix)` | Candidate — extra `contextPrefix`; confirm vs Rails 8.0.2                                                               | s2    |
| `process_controller_response`   | `(action, cookies, xhr)`             | `(action, _xhr)`                | Candidate — test helper drops `cookies`                                                                                 | s2    |
| `missing_attribute`             | `(attr_name, stack)`                 | `(attrName)`                    | **Noise** — `stack` is Ruby's explicit backtrace; JS captures it natively                                               | —     |
| `Callbacks.build`               | `(chain, filter, kind, options)`     | `(callback, options)`           | **Noise** — 3 overloaded `build` factories; matcher pairs the wrong one                                                 | —     |
| `read_data` (rack)              | `(io, outbuf)`                       | `(io)`                          | **Noise** — `outbuf` is a reused output buffer; no JS analogue                                                          | —     |

s1 fixes the high-confidence genuine pair. s2 confirms each candidate against both
sources and fixes only the subset that survives — a candidate that turns out to be
convention noise is moved to the s3 ledger, not forced.

### Scope guardrails

- **No heuristic change.** `arity.ts` / `compare.ts` are not touched. The check
  stays advisory. We are not adding `ARITY_OVERRIDES` entries to silence noise —
  the noise is documented in prose, not suppressed in code, so the advisory signal
  stays complete and honest.
- **No anti-fidelity rewrites.** A mismatch in the convention buckets is never
  "resolved" by changing application code to take fewer/more positional args.
- **No fan-out.** Each story is one PR from `main`, ≤500 LOC, non-overlapping
  files (the trails 500-LOC ceiling applies; docs-only stories are exempt).

### Relationship to RFC 0000-arel-collector-threading

That RFC converts the arel `ToSql` visitor to thread the collector as a second
arg (Rails' stateless-visitor design), which incidentally clears all 132 arel
`visit_*` arity mismatches. It is motivated by structural fidelity, **not** the
arity metric, and explicitly disclaims arity as its driver. This RFC is the
complement: it owns the _non-arel_ residual and is explicitly arity-motivated, but
narrowly — only the genuine code divergences. The two RFCs partition the 303
mismatches with no file overlap and can land in any order.

## Alternatives considered

- **Suppress the noise via `ARITY_OVERRIDES` (rejected).** Adding the ~165
  convention-bucket method names to the skip-set would make the summary read
  "near-zero," but it would hide real future regressions in those same methods and
  bloat a hand-maintained list. Documenting the residual in prose keeps the
  advisory signal complete. (Per design decision, the heuristic stays as-is.)
- **Rewrite ports to match Ruby arity (rejected).** Would zero the count by making
  the port less faithful — re-introducing hidden mutable state to drop positional
  args. Directly contradicts the port methodology `api:compare` exists to enforce.
- **Make arity enforcing with a shrinking baseline (rejected for now).** Considered
  and declined: the residual is dominated by convention noise that a baseline would
  have to enumerate and freeze, and the check's value today is as an advisory
  pointer. Revisit only if the convention buckets are ever absorbed at the
  extractor level (the #3045 follow-up to capture TS param _types_), which is out
  of scope here.
- **Fold this into RFC 0005 (activerecord-gaps) (rejected).** The genuine fixes
  span activerecord, actiondispatch, and actionview; a dedicated cluster keeps the
  arity-driven work discoverable and lets `next-bundle --cluster` target it.

## Rollout

Each phase is a separate PR from `main`, non-overlapping files, ≤500 LOC. CI runs
`test:compare` and the touched suites on every push. Run `api:compare --arity`
before/after to record the count delta (advisory; expect a small drop from the
genuine fixes, with the convention buckets unchanged by design).

1. **Phase 1 — INSERT `returning` (the flagship genuine divergence):** thread
   `returning` through `_insertRecord`; implement `_returningColumnsForInsert`;
   add the `name`/`primary_key`/`primary_key_value` insert args and the
   `prefetch_primary_key?` path the port currently omits. Mirror Rails
   `persistence.rb:238` test-for-test.
   → Story: [`s1-insert-returning`](stories/s1-insert-returning.md)

2. **Phase 2 — Confirm and fix the borderline genuine candidates:** for
   `get_chain`, `render_exception`, `partial_path`, `process_controller_response`,
   read both sources; fix the genuine subset, reclassify the rest into the s3
   ledger. No anti-fidelity rewrites.
   → Story: [`s2-genuine-divergences`](stories/s2-genuine-divergences.md)

3. **Phase 3 — Document the convention-noise residual:** commit the full
   per-method verdict ledger (all 171, bucketed) under `scripts/api-compare/` as
   prose, so future audits read the verdict instead of re-deriving it. Docs-only.
   → Story: [`s3-document-residual`](stories/s3-document-residual.md)

## Open questions

1. **`returning` adapter surface.** `_insertRecord` currently calls
   `connection.insert(im)`; threading `returning` requires the adapter's `insert`
   to accept and apply it (PostgreSQL `RETURNING`, others fetch the generated id).
   Phase 1 confirms whether the adapter layer already supports a returning path
   (and `_insertRecord` simply never wired it) or whether the adapter needs the
   plumbing too — and, if the latter is larger than one PR, registers the adapter
   work as a separate story rather than expanding s1.

2. **Borderline reclassification.** If all four s2 candidates turn out to be
   convention noise on close reading, s2 becomes a no-op and its content folds into
   the s3 ledger. That's an acceptable outcome — the RFC's value is the definitive
   triage plus the s1 fix; s2 is bounded by what the sources actually show.

## Stories

| ID                                                          | Title                                              | Status | Est LOC | Cluster                       |
| ----------------------------------------------------------- | -------------------------------------------------- | ------ | ------- | ----------------------------- |
| [s1-insert-returning](stories/s1-insert-returning.md)       | Thread `returning` through `_insert_record`        | draft  | 250     | api-compare-arity-divergences |
| [s2-genuine-divergences](stories/s2-genuine-divergences.md) | Confirm + fix borderline genuine arity divergences | draft  | 200     | api-compare-arity-divergences |
| [s3-document-residual](stories/s3-document-residual.md)     | Document the convention-noise residual ledger      | draft  | null    | api-compare-arity-divergences |

## Changelog

- 2026-06-09: initial RFC
