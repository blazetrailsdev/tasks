---
title: "Carry c_valid_ordinal_p's and c_valid_civil_p's negative-field normalizations"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6112
claim: "2026-08-05T01:59:57Z"
assignee: "i18n-date-rewrite-frags-and-new-by-frags-fast-path"
blocked-by: null
closed-reason: null
---

## Context

PR #6104 carried `c_valid_commercial_p`'s negative-day and negative-week
normalizations and `c_valid_weeknum_p`'s negative-day one. The same
normalization exists in the two remaining `c_valid_*_p` siblings and is **not**
carried:

- `c_valid_ordinal_p` (date-3.4.1 `ext/date/date_core.c:747-768`) — a negative
  `:yday` counts back from the last day of the year:

  ```c
      if (d < 0) {
      if (!c_find_ldoy(y, sg, &rjd2, &ns2))
          return 0;
      c_jd_to_ordinal(rjd2 + d + 1, sg, &ry2, &rd2);
      if (ry2 != y)
          return 0;
      d = rd2;
      }
  ```

- `c_valid_civil_p` (`date_core.c:770-790`) — `m += 13` for a negative month,
  an explicit `m < 1 || m > 12` range check, and a negative `:mday` counting
  back from the last day of the month via `c_find_ldom`.

`packages/i18n/src/date.ts`'s `rtValidOrdinalP` answers `null` for any
`yday < 1`, and `rtValidCivilP` leans on `Temporal.PlainDate`'s constructor
throw, which rejects a negative month or day rather than normalizing it. Both
carry a JSDoc note pointing here.

Same class as the commercial guard #6104 converged: the ported `date_parse.c`
sub-parsers cannot currently emit a negative `:yday`/`:mon`/`:mday`, so it is a
dropped guard rather than an observable `Date.parse` bug — but `Date.ordinal`
and `Date.civil` are not ported yet either, and they are the callers that make
it observable, exactly as `Date.commercial` did for the commercial one.

The date gem source is NOT vendored (C stdlib, no `vendor/rails` counterpart).
On this host it is readable at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/date_core.c`;
`gem contents date` returns nothing because `date` is a default gem.

## Converged shape

`rtValidOrdinalP` and `rtValidCivilP` run their negative normalizations ahead of
the round-trip comparison, in `c_valid_ordinal_p` / `c_valid_civil_p` order,
with `c_find_ldoy` / `c_find_ldom` ported alongside `c_find_fdoy` (already in
`date.ts`).

## Acceptance criteria

- [ ] A negative `:yday`, `:mon` and `:mday` resolve the way ruby 3.3.11 /
      date 3.4.1 resolves them, verified against the interpreter.
- [ ] `c_valid_civil_p`'s `m < 1 || m > 12` range check is explicit, not
      delegated to a `Temporal.PlainDate` throw.
- [ ] A negative field whose year/month does not round-trip is still rejected.
- [ ] Regression coverage in `date.trails.test.ts`.
- [ ] The "not carried" notes on `rtValidOrdinalP` / `rtValidCivilP` are
      deleted, not reworded.
