---
title: "strftime's %N/%L accept no width prefix, so %12N and %3N fall through verbatim"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6163
claim: "2026-08-07T01:48:27Z"
assignee: "datetime-new-accepts-a-non-final-fraction"
blocked-by: null
closed-reason: null
---

## Context

`strftime`'s `%N` and `%L` accept no width prefix, so a width-qualified
directive falls through to the output verbatim.

```text
trails:      new DateTime(2008, 3, 1, 6, 0, 0.5).strftime("%12N")  // => "%12N"
ruby 3.3.11: DateTime.new(2008, 3, 1, 6, 0, 0.5).strftime("%12N")  # => "500000000000"
             DateTime.new(2008, 3, 1, 6, 0, 0.5).strftime("%3N")   # => "500"
             DateTime.parse("2008-03-01T06:00:00.9999999999").strftime("%12N")
                                                                   # => "999999999900"
```

`packages/date/src/date.ts`'s formatter hardcodes nine digits for `%N`
(`String(subject.nsec).padStart(9, "0")`) and three for `%L`, so neither the
narrower nor the wider form works. MRI's `date_strftime.c` reads the width off
the directive and takes the LEADING `w` digits of the fraction — truncating,
never rounding — which is why the `.9999999999` case keeps its sub-nanosecond
tail at width 12 while width 9 answers `"999999999"`.

Note the wider form needs sub-nanosecond state: `sf` is a Rational in MRI and a
`number` of nanoseconds in trails, and PR #6161's `dtNewByFrags` already keeps
the exact parsed fraction there (only `strftime` truncates it), so the state is
present — it is the formatter that cannot spell it.

Surfaced while porting the fractional second (PR #6161); out of that PR's scope.

## Converged shape

The formatter parses the width prefix ahead of `%N`/`%L` as `date_strftime.c`
does, and takes the leading `w` digits of the fractional second, zero-padded on
the right. `%N` keeps its default of 9 and `%L` its default of 3.

## Acceptance criteria

- [ ] `%3N`, `%6N`, `%9N` and `%12N` all answer the leading digits, right-padded.
- [ ] Bare `%N` and `%L` are unchanged (9 and 3 digits).
- [ ] The `.9999999999` parse answers `"999999999"` at width 9 and
      `"999999999900"` at width 12 — truncation, not rounding.
- [ ] `::Date` still answers zeros at every width.
- [ ] Verify each value against a live `ruby -rdate -e`.
