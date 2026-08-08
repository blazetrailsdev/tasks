---
title: "cValidOrdinalP reads Temporal#year back instead of round-tripping through c_jd_to_ordinal"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6208
claim: "2026-08-07T22:48:41Z"
assignee: "port-c-civil-to-jd-and-c-jd-to-civil-at-their-rails-names"
blocked-by: null
closed-reason: null
---

## Context

`c_valid_ordinal_p` (`vendor/date/ext/date/date_core.c:674-695`) rejects an
out-of-range ordinal by round-tripping the Julian day back through
`c_jd_to_ordinal` (`date_core.c:566-575`) and comparing the year it names.
`c_jd_to_ordinal` is itself `c_jd_to_civil` + `c_find_fdoy` + `(jd - rjd) + 1`.

`cValidOrdinalP` (`packages/date/src/date.ts:3016-3022`) has no `cJdToOrdinal`
to call, so it reads `Temporal.PlainDate#year` back instead:

```ts
const fdoy = jdToPlainDate(cFindFdoy(y));
if (d < 0) d = fdoy.daysInYear + d + 1;
if (d < 1) return null;
const r = fdoy.add({ days: d - 1 });
if (r.year !== y) return null;
```

Same answer, different decomposition — the sibling validators
(`cValidCommercialP`, `cValidWeeknumP`) do round-trip through their real
`cJdToCommercial` / `cJdToWeeknum`, so this is the odd one out. PR #6203
converged the `c_find_fdoy` half and left this half.

`c_ordinal_to_jd` (`date_core.c:556-564`) is also unported and is the other
side of the same pair.

## Converged shape

Port `cOrdinalToJd(y, d)` and `cJdToOrdinal(jd)` at their Rails names, and
rewrite `cValidOrdinalP` as the C is: build the jd, read it back, reject when
the year differs. Carry the existing `sg`/`ns` treatment.

Best done after (or with) the `cCivilToJd`/`cJdToCivil` rename, since
`c_jd_to_ordinal` calls `c_jd_to_civil`.

## Acceptance criteria

- [ ] `cOrdinalToJd` / `cJdToOrdinal` exist at their Rails names.
- [ ] `cValidOrdinalP` round-trips through `cJdToOrdinal` rather than reading
      `Temporal.PlainDate#year` back.
- [ ] Existing `packages/date` tests pass untouched.
