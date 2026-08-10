---
title: "dNewByFrags/dtNewByFrags re-validate where d_simple_new_internal writes directly"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6157
claim: "2026-08-06T15:03:06Z"
assignee: "d-new-by-frags-skips-the-second-civil-validation"
blocked-by: null
closed-reason: null
---

## Context

Rails deviation surfaced while shipping `date-state-onto-temporal-plaindate`
(PR #6153). **This is a convergence story: converge onto the Ruby shape, do not
close it by writing a better justification.**

ruby/date's `d_new_by_frags` (`vendor/date/ext/date/date_core.c:4282-4304`) ends
at `d_simple_new_internal(cDate, nth, rjd, sg, 0, 0, 0, HAVE_JD)` — it writes
the Julian day straight into a fresh `SimpleDateData` under `HAVE_JD` alone and
performs **no** validation, because `rt__valid_date_frags_p` has already
established the date is buildable. `dt_new_by_frags` (`date_core.c:8239-8322`)
does the same through `d_complex_new_internal`.

`packages/date/src/date.ts`'s ports end instead at
`new Date(jd.year, jd.month, jd.day)` / `new DateTime(jd.year, jd.month,
jd.day, rh, rmin, rs, of)`, so `Date`'s constructor runs `cValidCivilP` — and
therefore `Temporal.PlainDate.from(..., { overflow: "reject" })` — a second time
over a `PlainDate` that is valid by construction. The same shape appears in
`Date.jd`, `Date.ordinal` and `Date.commercial`, each of which resolves a
`PlainDate` and then re-enters the validating constructor with its `year`/
`month`/`day`.

It is not a correctness bug — the second pass is a no-op — but it is an extra
validation ruby/date does not perform and an extra decomposition step at each of
five call sites.

The reason it shipped: reproducing `d_simple_new_internal`'s unvalidated write
needs a construction path a **module-level** function (`dNewByFrags`,
`dtNewByFrags` are module-level, as they are in the C) can reach while
bypassing the public constructor. A `#private` static is unreachable from
outside the class body, and the TS spellings that do work — a module-private
`WeakMap`, a hidden constructor sentinel argument — are machinery ruby/date has
no counterpart for. That is a reason it was deferred, **not** a ratification.

## Acceptance criteria

- [ ] `dNewByFrags`, `dtNewByFrags`, `Date.jd`, `Date.ordinal` and
      `Date.commercial` build the result **without** re-running `cValidCivilP`
      over an already-valid `Temporal.PlainDate`, mirroring
      `d_simple_new_internal` / `d_complex_new_internal`
      (`date_core.c:4282-4304`, `date_core.c:8239-8322`).
- [ ] Whatever seam carries the unvalidated write is the smallest one that
      works and is justified at the call site as a TypeScript language
      shortcoming, or — better — is avoided entirely.
- [ ] No new public surface: `pnpm parity:api:extra --package date` unchanged.
- [ ] `packages/date/src/date.trails.test.ts` still green, including the
      `Date::Error` arms — an invalid frag set must still raise `"invalid
date"` from `dNewByFrags`, not slip through the removed validation.
- [ ] `pnpm parity:api:calls` clean; `pnpm parity:api` / `pnpm parity:test` deltas
      non-negative.
