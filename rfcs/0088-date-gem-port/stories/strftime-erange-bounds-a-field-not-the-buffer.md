---
title: "strftime-erange-bounds-a-field-not-the-buffer"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6335
claim: "2026-08-10T13:33:27Z"
assignee: "date-parse-limit-kwarg-and-bignum-year"
blocked-by: null
closed-reason: null
---

## Context

PR #6317 ported `Errno::ERANGE` for `Date#strftime` (`packages/date/src/date.ts`)
as two guards measured against `maxsize = 1024 * format.length` — the size
`date_strftime_alloc` doubles its buffer up to before it gives up and
`rb_sys_fail`s (`vendor/date/ext/date/date_core.c:7081-7097`):

- a precision past it (`vendor/date/ext/date/date_strftime.c:577-582`), and
- a single rendered field past it (`FILL_PADDING`,
  `vendor/date/ext/date/date_strftime.c:124-126`).

That covers both arms `test_strftime` asserts, but it is not the C's condition.
The C writes into ONE buffer of `size` and fails when the **accumulated** output
runs past `endp` (`date_strftime.c:54`, `char *endp = s + maxsize`), not when a
single field does. So a format whose fields are individually short but whose
total exceeds `1024 * flen` raises `Errno::ERANGE` in MRI and returns a string
here.

The `SMALLBUF` first pass (`date_core.c:7066`, `:7079`) is also not modelled;
it is unobservable on its own, but it is the reason `errno` is consulted rather
than the length, and any convergence should follow the same shape.

## Converged shape

Measure the accumulated output against `maxsize` as the C's `endp` does, rather
than each field in isolation — one bound check at the point the formatter
appends, over `out.length + formatted.length`. The two existing guards stay;
this widens the second one from per-field to per-buffer.

## Acceptance criteria

- [ ] A format whose total rendered length exceeds `1024 * format.length` while
      no single field does raises `Errno::ERANGE`, matching MRI.
- [ ] `test_strftime` in `packages/date/src/test-switch-hitter.test.ts` still
      passes unchanged.
