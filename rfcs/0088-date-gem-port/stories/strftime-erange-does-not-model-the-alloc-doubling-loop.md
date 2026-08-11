---
title: "strftime-erange-does-not-model-the-alloc-doubling-loop"
status: done
updated: 2026-08-11
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6371
claim: "2026-08-11T17:56:00Z"
assignee: "converge-relation-where-clause-writer"
blocked-by: null
closed-reason: null
---

## Context

`strftime` (`packages/date/src/date.ts`) raises `Errno::ERANGE` when the
accumulated output passes `maxsize = 1024 * format.length` (PR #6335, RFC 0088
`strftime-erange-bounds-a-field-not-the-buffer`). That models
`char *endp = s + maxsize` (`vendor/date/ext/date/date_strftime.c:54`) but NOT
the buffer growth `date_strftime_alloc` performs around it
(`vendor/date/ext/date/date_core.c:7066-7097`):

```text
len = date_strftime(*buf, SMALLBUF, format, tmx);       /* :7079, SMALLBUF = 100 */
if (len != 0 || (**buf == '\0' && errno != ERANGE)) return len;
for (size = 1024; ; size *= 2) {
    len = date_strftime(*buf, size, format, tmx);
    if (len > 0) break;
    if (size >= 1024 * flen) { rb_sys_fail(format); break; }
}
```

`maxsize` is only the size the loop gives UP at, not the size it stops growing
at: the loop tries `size` FIRST and only then tests `size >= 1024 * flen`, so a
format needing more than `1024 * flen` still succeeds whenever the next power of
two after the failure fits it. MRI therefore does not raise where trails does:

```text
Date.new(2001, 2, 3).strftime("%6145Y").length  #=> 6145   (maxsize = 6144)
```

trails raises there — the pre-existing precision guard (`prec > maxsize`) fires
first, so this is not a regression from #6335, but both guards are tighter than
MRI by up to one doubling.

## Converged shape

Model the `date_strftime_alloc` loop rather than the single `maxsize` bound:
the `SMALLBUF` first pass, then `size = 1024` doubling, failing only when a
pass at `size >= 1024 * flen` still does not fit. The `endp` check stays as the
per-pass bound it already is — it is what makes a pass fail — and the two
existing guards become the inner test rather than the outer one.

## Acceptance criteria

- [ ] `Date.new(2001, 2, 3).strftime("%6145Y")` answers a 6145-character string,
      as MRI does, rather than raising.
- [ ] `'%100000Y' * 13` still raises `Errno::ERANGE` (the #6335 test in
      `date.trails.test.ts`), and `test_strftime` in
      `test-switch-hitter.test.ts` still passes unchanged.
