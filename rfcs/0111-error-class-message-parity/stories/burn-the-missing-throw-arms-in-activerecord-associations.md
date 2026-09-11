---
title: "Raise what Rails raises: the 9 missing-throw arms in activerecord associations"
status: ready
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0113's arm measurement (`report-arms.ts`) projects every name-matched
pair's control tokens. One stratum of it is gated: rows whose multiset
difference **drops a `throw`** — a Rails body that raises where the trails port
does not. The audit read all 69 of them in full: 61 real divergences, 8
lowering artefacts, an 11.6% non-real rate whose 95% interval (4.1%-19.1%) sits
entirely under the RFC's pre-committed one-third tripwire. A dropped raise is a
real divergence nine times in ten.

The gate is `pnpm parity:api:arms:throws`, only-shrink over
`scripts/api-compare/arm-throw-mark.json`, and it runs in CI's
`rails-comparison` job. Nobody owns burning the marks down, which is what this
story does for one slice of the population.

CLAUDE.md's fidelity rule is the whole specification here: _"Same error class,
same message string, same raise site."_ That is why these live under RFC 0111 —
a dropped `throw` is a missing raise site.

### The rows in this slice (9)

- `activerecord/associations/alias-tracker.ts#initialCountFor`
- `activerecord/associations/collection-association.ts#concatRecords`
- `activerecord/associations/has-many-association.ts#handleDependency`
- `activerecord/associations/has-many-through-association.ts#findTarget`
- `activerecord/associations/has-one-association.ts#delete`
- `activerecord/associations/has-one-association.ts#handleDependency`
- `activerecord/associations/preloader/branch.ts#constructor`
- `activerecord/associations/singular-association.ts#replace`
- `activerecord/autosave-association.ts#addAutosaveAssociationCallbacks`

## Acceptance criteria

- [ ] For each row: read the Rails body at its `vendor/rails` counterpart, and
      raise the same error class with the same message at the same site — or,
      if the row is an artefact rather than a divergence, say which of the two
      artefact classes it is and leave the mark alone.
- [ ] `pnpm parity:api:arms:throws` is green.
- [ ] Converged rows are retired with
      `pnpm parity:api:arms:throws:tighten`, which writes the mark DOWN. There
      is no reseed, and the mark is never raised.
- [ ] No new `call-mismatches-exclude` row: `pnpm parity:api:calls` and
      `pnpm parity:api:calls:args` stay green.
- [ ] Each converged raise is covered by a test that fails on baseline.

## Definition of done

Raising the mark does not close this story, and neither does raising a
different error class than Rails raises at that site — the gate counts tokens,
so a `throw new Error(...)` satisfies it while failing the rule it exists to
enforce.

Four rows across the whole population are a **permanent floor**, not debt:
Ruby-only guards with no JS counterpart (the audit's Gap 5). If a row in this
slice is one of them, record which and leave its mark — do not invent a JS
construct to make the token appear.

## Verification

`pnpm parity:api:arms:throws`, plus
`pnpm tsx scripts/api-compare/report-arms.ts --report --direction=missing --token=throw`
to confirm the rows in this slice are gone from the listing.

## Notes

`if`, `loop`, `try` and `rescue` stay report-only — the whole population is
75.0% non-real and `if` alone is 1,891 of 2,141 rows. Do not treat a `+if` or
`-loop` beside one of these rows as work; only the `throw` stratum is gated.
