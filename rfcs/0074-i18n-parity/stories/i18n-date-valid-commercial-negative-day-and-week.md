---
title: "Carry c_valid_commercial_p's negative-day and negative-week normalizations"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6104
claim: "2026-08-04T23:35:04Z"
assignee: "i18n-date-complete-frags-weeknum-entries"
blocked-by: null
closed-reason: null
---

## Context

`Date.parse`'s commercial arm (`packages/i18n/src/date.ts`) carries
`c_valid_commercial_p`'s round-trip check as of PR #6099 — it compares the
rebuilt `yearOfWeek`/`weekOfYear`/`dayOfWeek` the way date-3.4.1
`ext/date/date_core.c:806-808` compares `y != ry2 || w != *rw || d != *rd`.
The two normalizations that run _before_ that check are still missing
(`date_core.c:792-805`):

```c
    if (d < 0)
    d += 8;
    if (w < 0) {
    c_commercial_to_jd(y + 1, 1, 1, sg, &rjd2, &ns2);
    c_jd_to_commercial(rjd2 + w * 7, sg, &ry2, &rw2, &rd2);
    if (ry2 != y)
        return 0;
    w = rw2;
    }
```

so Ruby counts a negative commercial day back from Sunday (`-1` is day 7) and a
negative week back from the end of the commercial year (`-1` is the last week),
while trails builds a nonsense date from the negative value and then rejects it
on the round-trip. Same class as the dropped day check #6099 converged: the
ported sub-parsers cannot currently produce a negative `:cwday`/`:cweek`, so it
is a dropped guard rather than an observable bug — but it is a guard nobody
reasoned about at the Ruby, and `Date.parse` is not the only future caller.

## Converged shape

Both normalizations run ahead of the round-trip comparison, in
`c_valid_commercial_p`'s order, against the same `cwyear`.

## Acceptance criteria

- A negative `:cwday` and a negative `:cweek` resolve the way ruby 3.3.11 /
  date 3.4.1 resolves them, verified against the interpreter.
- A negative week whose year does not round-trip is still rejected.
- Regression coverage in `date.trails.test.ts`.
