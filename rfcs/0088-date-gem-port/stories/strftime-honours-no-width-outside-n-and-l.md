---
title: "strftime honours a width prefix only on %N/%L, where date_strftime.c reads one ahead of every directive"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6178
claim: "2026-08-07T16:02:16Z"
assignee: "i18n-locale-tag-rfc4646"
blocked-by: null
closed-reason: null
---

## Context

PR #6163 taught `strftime` the width prefix for `%N` and `%L` only. MRI reads
one ahead of EVERY directive: `date_strftime.c`'s `again:` switch parses the
flags, the padding character and the width into `precision`
(`vendor/date/ext/date/date_strftime.c:160-235`), and each arm's `FMT` /
`FMTV` macro (`date_strftime.c:104-150`) honours it with the arm's own default
width and padding character.

```text
ruby 3.3.11: DateTime.new(2008, 3, 1, 6, 0, 0.5).strftime("%12S")  # => "000000000000"
             Date.new(2008, 3, 1).strftime("%6m")                  # => "000003"
trails:      new DateTime(2008, 3, 1, 6, 0, 0.5).strftime("%12S")  // => "%12S"
```

`packages/date/src/date.ts:strftime` matches the width into a capture group but
deliberately returns the directive verbatim unless the spec is `L` or `N`, so
every other width-qualified directive still falls through. That was PR #6163's
scope line, not a judgement that the rest is right.

The `-` flag is a second half of the same gap: `date_strftime.c:109` sets
`precision = 1` under `BIT_OF(LEFT)`, where the port strips leading zeros off
the formatted result instead. The two agree on today's directives and would not
agree on a width-qualified one.

## Converged shape

`strftime` parses flags, padding and width once, as `date_strftime.c:160-235`
does, and each directive formats through the equivalent of `FMT(def_pad,
def_prec, ...)` with the C's own defaults per arm rather than a hardcoded
`padStart`. `%L`/`%N` keep the arm they already have. The `-` flag becomes
`precision = 1` at the parse, not a post-hoc strip.

## Acceptance criteria

- [ ] `%12S`, `%6m`, `%4d` and friends answer MRI's padded values.
- [ ] Every directive's bare form is byte-identical to today.
- [ ] `%-d`, `%-m` and the other `-` spellings are unchanged.
- [ ] An unknown directive still falls through verbatim, width or no width.
- [ ] Verify each value against a live `ruby -rdate -e`.
