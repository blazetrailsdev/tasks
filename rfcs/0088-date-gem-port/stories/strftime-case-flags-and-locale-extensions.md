---
title: "strftime drops the E and O locale-extension flag cases date_strftime.c reads ahead of every directive"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6250
claim: "2026-08-08T17:40:02Z"
assignee: "date-constructor-is-proleptic-gregorian-not-italy"
blocked-by: null
closed-reason: null
---

## Context

Narrowed by PR #6193 (`strftime-lacks-composite-conversions`), which shipped the
`^` and `#` half of this story: `strftime` (`packages/date/src/date.ts`) now has
a `case "^"` setting `upper` and a `case "#"` setting `chcase`, both behind
`flagFound()` as the C is, the `CHCASE`-to-`UPPER` resolution on
`%A`/`%a`/`%B`/`%b`/`%h`, the `CHCASE`-to-`LOWER` resolution on `%Z`, the
asymmetric `%p`/`%P` rule at `date_strftime.c:341-345`, and the shared
upcase/downcase tail. `%^b` is `"MAR"` and `%^P` is `"AM"`.

Two flag cases remain unimplemented, so each still falls through to `unknown:`
verbatim:

- `case 'E'` (`vendor/date/ext/date/date_strftime.c:524-529`) — sets
  `BIT_OF(LOCALE_E)` and `goto again` when the NEXT character is in `"cCxXyY"`,
  otherwise `goto unknown`.
- `case 'O'` (`date_strftime.c:530-535`) — sets `BIT_OF(LOCALE_O)` and
  `goto again` when the next character is in `"deHkIlmMSuUVwWy"`, otherwise
  `goto unknown`.

Measured on ruby 3.3.11 against `DateTime.new(2008, 3, 1, 6, 7, 8.5)`:

```text
ruby:   strftime("%Oy") # => "08"     strftime("%Ey") # => "08"
        strftime("%Oz") # => "%Oz"    strftime("%Ez") # => "%Ez"
trails: strftime("%Oy") # => "%Oy"    strftime("%Ey") # => "%Ey"
```

Note the whitelists are load-bearing in BOTH directions: `%Oz` is unknown
because `z` is not in `O`'s list, and `date.trails.test.ts` already pins
`%Ez` => `"%Ez"` — that expectation must keep passing.

`flagFound()` (`date.ts`) currently returns `precision > 0` only; its JSDoc says
the `LOCALE_E`/`LOCALE_O`/`COLONS` arms of the C's `FLAG_FOUND`
(`date_strftime.c:90-93`) are unreachable "because neither can set its flag and
go on to read another". Implementing `E`/`O` makes them reachable, so that
predicate has to grow the two bits at the same time or `%E3y` silently differs.

## Converged shape

The scanner grows an `E` and an `O` case that consult their own whitelist and
`continue` the flag loop only on a hit, falling through to the unknown path
otherwise, and `flagFound()` grows the `localeE`/`localeO` bits the C's
`FLAG_FOUND` reads. Both extensions are then accepted and ignored, exactly as
the C ignores them ("POSIX locale extensions, ignored for now") — `%Oy` is `%y`.

## Acceptance criteria

- [ ] `%E`/`%O` followed by a whitelisted directive answer that directive's
      value; followed by anything else they answer the literal text, as MRI does.
- [ ] `flagFound()` covers the `LOCALE_E`/`LOCALE_O` bits and its JSDoc no
      longer claims they are unreachable.
- [ ] `date.trails.test.ts`'s existing `%Ez` => `"%Ez"` expectation still passes.
