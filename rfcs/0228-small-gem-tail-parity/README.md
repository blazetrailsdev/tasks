---
rfc: "0228-small-gem-tail-parity"
title: "Small-gem tail: date, builder, rack and actionview residuals"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "date"
  - "builder"
  - "rack"
  - "actionview"
clusters: []
priority: 3
---

# RFC 0228 — Small-gem tail: date, builder, rack and actionview residuals

## Summary

One story per package residual left in the small gems and the near-complete
Rails packages, skipping any gap an open story already owns.

## Motivation

trailmap's numbers for this tail predate several merges. `pnpm parity:api` /
`parity:test` on 2026-11-09 (fresh build):

| Package      | api         | tests                                            | Residual owner                                                                                                                |
| ------------ | ----------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| date         | 9 / 10      | 137 / 137                                        | `date-infinity-unary-plus`                                                                                                    |
| builder      | 34 / 34     | 96 / 98                                          | `builder-markupbuilder-duplicate-named-tests`                                                                                 |
| fugit        | 349 / 349   | 420 / 420 (1 skip: Ruby's own pending `@reboot`) | none: at parity                                                                                                               |
| rack         | 600 / 600   | 941 / 960, 4 misplaced, 8 skipped                | this RFC + `rack-3-2-port-remaining-multipart-specs` (0141) + `ruby-compat-hash-answers-rack-headers-public-interface` (0154) |
| rack-session | 98 / 98     | 124 / 124 (1 PERMANENT skip)                     | none: at parity                                                                                                               |
| rack-test    | 108 / 108   | 234 / 234 (1 PERMANENT skip)                     | none: at parity                                                                                                               |
| actioncable  | 496 / 496   | 215 / 215 (2 PERMANENT skips)                    | none: at parity                                                                                                               |
| actionview   | 3057 / 3057 | 2562 / 2562, 46 skipped (41 PERMANENT)           | this RFC + `html-sanitizer-port-scrubbers`, `html-sanitizer-safe-list-sanitize-css` (0123)                                    |

## Design

Five stories. rack's multipart gap (10 missing, 3 misplaced) is
`rack-3-2-port-remaining-multipart-specs`' acceptance list verbatim, and the
`public interface` headers skip is `ruby-compat-hash-answers-rack-headers-public-interface`'s;
neither is re-filed.

## Non-goals

- **`PERMANENT-SKIP` tests** with a cited CLAUDE.md section.
- **actionview's sanitizer skips**, owned by blocked 0123 stories.

## Alternatives considered

- **One story for the whole tail.** Rejected: the packages share nothing and
  would serialize unrelated reviews.

## Rollout

1. `date-infinity-unary-plus`, `builder-utf-markup-kcode-arm-tests`,
   `rack-static-dot-segment-admin-header-tests`,
   `rack-response-headers-hash-test-and-mock-request-move`,
   `actionview-layouts-are-included-unblocked` (all independent)

## Verification

- `pnpm parity:api`: date 10/10.
- `pnpm parity:test`: builder 98/98.
- rack 947/960. The 13 left are the 10 missing and 3 misplaced multipart tests
  that `rack-3-2-port-remaining-multipart-specs` owns. The one open skip
  ("public interface") is owned by
  `ruby-compat-hash-answers-rack-headers-public-interface`.
- actionview has 45 skips: 41 `PERMANENT-SKIP` and 4 owned by
  `html-sanitizer-port-scrubbers` / `html-sanitizer-safe-list-sanitize-css`.

## Open questions

None open: each residual has one obvious port.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
- 2026-11-09: revised for review feedback.
