---
title: "ruby-compat's 52 unreceipted moved-name members violate rule 2; receipt them and go rowless"
status: draft
updated: 2026-09-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat`'s RFC 0117 extra-surface mark is `{"novel": 0, "total": 52}`
(`scripts/api-compare/extra-surface-mark.json`). Every one of the 52 is a
public member with NO `@noRailsEquivalent` receipt whose name happens to
collide with a Rails method in some other `.rb`, so it scores "moved" rather
than novel and escapes the tagged-only `novel === 0` pin. They violate
`packages/ruby-compat/README.md` rule 2, which requires a `vendor/ruby`
citation AND a `@noRailsEquivalent PERMANENT` receipt on every export.

`pnpm parity:api:extra --package ruby-compat --verbose` on main at 171a758235:

- `uri/generic.ts` (12): authority constructor DEFAULT_PORT defaultPort host merge parser path port query scheme toString
- `range.ts` (9): caseEquals constructor each end equals first isInclude last step
- `string-io.ts` (9): close closed constructor isEof read rewind size string write
- `uri/rfc2396-parser.ts` (7): constructor escape parse pattern regexp split unescape
- `uri/common.ts` (3): constructor for parse
- `uri/rfc3986-parser.ts` (3): parse regexp split
- `json.ts` (2): dump load
- one each: `encoding-error.ts`, `io-error.ts`, `kernel-catch.ts`,
  `name-error.ts` (constructor), `hash.ts` (get), `uri/http.ts`,
  `uri/https.ts` (DEFAULT_PORT)

A receipt on such a member is subtracted from `total`
(`scripts/api-compare/extra-surface.ts:1834-1842`); verified by receipting
`StringIO#rewind`, which dropped `total` 52 → 51.

## Acceptance criteria

- Each of the 52 carries a resolvable `vendor/ruby/<file>:<line>` citation and
  a `@noRailsEquivalent PERMANENT` receipt, or is deleted if nothing calls it.
- The mark is narrowed with `pnpm parity:api:extra:tighten`; at `total: 0`
  ruby-compat moves to `ROWLESS_PACKAGES` and its row is deleted.
