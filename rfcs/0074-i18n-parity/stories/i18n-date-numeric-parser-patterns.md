---
title: "parse_iso/parse_sla/parse_dot drop the apostrophe arm and NUMBER"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6100
claim: "2026-08-04T22:59:07Z"
assignee: "i18n-date-numeric-parser-patterns"
blocked-by: null
closed-reason: null
---

# `parse_iso` / `parse_sla` / `parse_dot` drop the apostrophe arm and `NUMBER`

## Context

Three numeric sub-parsers in `packages/i18n/src/date.ts` carry patterns that are
not the ones `date_parse.c` compiles. Noticed while porting `subx`'s `_cb`
decomposition (PR #6092), which touched the bodies but deliberately left the
patterns alone.

`date-3.4.1/ext/date/date_parse.c`, non-`TIGHT_PARSER` arms, where
`NUMBER` is `"(?<!\\d)\\d"` (`date_parse.c:259`):

- `parse_iso` (`date_parse.c:1020`)
  `"('?[-+]?" NUMBER "+)-(\\d+)-('?-?\\d+)"`
  trails: `/([-+]?\d+)-(\d+)-(-?\d+)/`
- `parse_sla` (`date_parse.c:1469`)
  `"('?-?" NUMBER "+)/\\s*('?\\d+)(?:\\D\\s*('?-?\\d+))?"`
  trails: `/([-+]?\d+)\/\s*(\d+)(?:\D\s*(-?\d+))?/`
- `parse_dot` (`date_parse.c:1577`)
  `"('?-?" NUMBER "+)\\.\\s*('?\\d+)\\.\\s*('?-?\\d+)"`
  trails: `/([-+]?\d+)\.\s*(\d+)\.\s*(-?\d+)/`

Three divergence classes, all silent:

1. **The `'?` arm is gone from every group.** `s3e` (`date_parse.c:80-253`,
   ported) branches on a leading apostrophe to decide which token is the year
   — `y = d` when `d[0] === "'"` (`date_parse.c:99-157`). The ported `s3e` has
   that branch, but these three patterns can never hand it an apostrophe, so
   `"'01-02-03"` and `"'01.02.03"` take the wrong year arm.
2. **`\d+` where C writes `NUMBER+`.** `NUMBER` is a digit with a
   `(?<!\d)` guard, so C's first group cannot start mid-run. `\d+` can, which
   changes which text the leading group takes on a longer digit run — and,
   through `subx`, what is left for the sub-parsers below.
3. **`[-+]?` where `parse_sla` / `parse_dot` write `-?`.** trails accepts a
   leading `+` on both, which C accepts only for `parse_iso`.

`parse_eu` already spells its first group `('?${NUMBER}+)` (date.ts), so the
converged shape is in the file already.

## Acceptance criteria

- The three patterns are the `date_parse.c` sources above, character for
  character modulo the C string escaping — `'?` on each group C has it on,
  `NUMBER` where C writes `NUMBER`, and `-?` vs `[-+]?` per parser.
- Cases in `packages/i18n/src/date.trails.test.ts` covering the apostrophe
  year (`"'01-02-03"`, `"'01.02.03"`, `"'01/02/03"`) and the `NUMBER` boundary,
  each failing on the current patterns.
- No regression in `date.trails.test.ts`; `pnpm parity:api:calls` / `parity:api:calls`
  stay green.
