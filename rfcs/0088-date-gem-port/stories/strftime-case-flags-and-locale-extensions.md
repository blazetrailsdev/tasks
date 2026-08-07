---
title: "strftime drops the ^ # E O flag cases date_strftime.c reads ahead of every directive"
status: draft
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`strftime` (`packages/date/src/date.ts`) reads flags, padding and width ahead of
every directive since PR #6178, but four of `date_strftime.c`'s flag cases are
still unimplemented, so each falls through to `unknown:` verbatim:

- `case '^'` (`vendor/date/ext/date/date_strftime.c:561-564`) sets
  `BIT_OF(UPPER)`.
- `case '#'` (`date_strftime.c:566-569`) sets `BIT_OF(CHCASE)`.
- `case 'E'` (`date_strftime.c:524-529`) and `case 'O'` (`date_strftime.c:530-535`)
  set the POSIX locale extensions and `goto again` when the NEXT character is in
  their own whitelist (`"cCxXyY"` for `E`, `"deHkIlmMSuUVwWy"` for `O`),
  otherwise `goto unknown`.

The flags are consumed by the `break` arms and by `STRFTIME`: `%A`/`%a`
(`date_strftime.c:176-179`), `%B`/`%b`/`%h` (`:196-199`), `%p`/`%P`
(`:341-345`), `%Z` (`:413-416`), and `STRFTIME`'s own
`if (flags & BIT_OF(UPPER)) upcase(s, i)` (`:121-122`). The trailing
`if (i)` block (`:594-604`) then applies `upcase`/`downcase` to the arm's text.

Measured on ruby 3.3.11 against `DateTime.new(2008, 3, 1, 6, 7, 8.5)`:

```text
ruby:   strftime("%^b") # => "MAR"      strftime("%#p") # => "am"
        strftime("%Oy") # => "08"       strftime("%^a") # => "SAT"
trails: strftime("%^b") # => "%^b"      strftime("%#p") # => "%#p"
        strftime("%Oy") # => "%Oy"      strftime("%^a") # => "%^a"
```

Surfaced by the ~640-pair live-MRI differential run in PR #6178; the port's own
JSDoc names these as the recognised-directive scope line, not as correct.

## Converged shape

The scanner grows a `^` and a `#` case setting `upper` / `chcase`, and an `E`
and an `O` case that `goto again` only when the next character is in that
extension's whitelist. Each of the four goes through `flagFound()` first, as the
C does. The `break` arms resolve `CHCASE` to `UPPER` (`%A`/`%a`/`%B`/`%b`/`%h`)
or to `LOWER` (`%Z`), `%p`/`%P` follow `date_strftime.c:341-345`'s asymmetric
rule, and the shared tail upcases or downcases the arm's text.

`%E`/`%O` are accepted and then ignored, exactly as the C ignores them ("POSIX
locale extensions, ignored for now") — `%Oy` is `%y`.

## Acceptance criteria

- [ ] `%^b`, `%^a`, `%^B`, `%^A`, `%^Z`, `%#p`, `%#P`, `%#b`, `%Oy`, `%Ey` and
      `%OS` answer MRI's values.
- [ ] `%^q` and `%Eq` (a flag whose next char is not in the whitelist) still
      fall through verbatim.
- [ ] `%3^S` is verbatim — `FLAG_FOUND` applies to these flags too.
- [ ] Every directive's bare form is byte-identical to today.
- [ ] Verify each value against a live `ruby -rdate -e`.
