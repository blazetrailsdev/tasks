---
title: "check-limit-measures-utf16-units-not-bytes"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6341
claim: "2026-08-10T15:09:04Z"
assignee: "check-limit-measures-utf16-units-not-bytes"
blocked-by: null
closed-reason: null
---

## Context

`checkLimit` (`packages/date/src/date.ts`) measures `str.length` — UTF-16 code
units — where the C measures `RSTRING_LEN(str)`, bytes
(`vendor/date/ext/date/date_core.c:4468-4479`):

```text
slen = RSTRING_LEN(str);
limit = get_limit(opt);
if (slen > limit)
    rb_raise(rb_eArgError,
             "string length (%u) exceeds the limit %u", slen, limit);
```

The two agree on ASCII, which is all the gem's own tests use, so the deviation
is cited at the call site and untested. They diverge on any non-ASCII string:
`test_parse_utf8` (`vendor/date/test/date/test_date_parse.rb`) parses
`"Sun\u{3000}Aug 16 01:02:03 \u{65e5}\u{672c} 2009"`, whose UTF-8 byte length
exceeds its UTF-16 length, and the message the raise carries reports the wrong
number either way.

## Converged shape

Measure UTF-8 bytes, as `RSTRING_LEN` does over the ASCII-compatible encoding
`date_s__parse_internal` has already checked for
(`rb_enc_str_asciicompat_p`, `date_core.c:4490-4492`). `TextEncoder` is not
available under the repo's no-`node:*` rule as an import, but it is a global —
confirm before reaching for a hand-rolled counter.

## Acceptance criteria

- [ ] `Date._parse` and every `_`-parser taking `limit:` measure UTF-8 bytes,
      and the `ArgumentError` message reports that byte count.
- [ ] A trails-only test in `date.trails.test.ts` covers a multi-byte string
      whose byte length crosses the limit while its UTF-16 length does not.
- [ ] The `length limit` and leading-space `parse too long year` tests in `test-date-parse.test.ts`
      still pass unchanged.
