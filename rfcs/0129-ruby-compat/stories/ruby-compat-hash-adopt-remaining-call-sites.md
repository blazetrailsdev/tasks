---
title: "Adopt the Hash call form at the remaining 43 baselined call sites"
status: done
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 37
pr: 7339
claim: "2026-09-01T13:15:59Z"
assignee: "ruby-compat-hash-adopt-remaining-call-sites"
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat-hash-merge-and-iteration` (PR pending) shipped the Ruby core Hash
mutation/iteration members in `packages/ruby-compat/src/hash.ts` — `merge`,
`update` / `mergeBang`, `deleteIf`, `reject`, `eachPair`, `eachKey`,
`transformValues`, `slice`, `except` — each with a `vendor/ruby/hash.c:LINE`
citation, and adopted them at the five `actiondispatch/journey` call sites that
carried baseline rows (`journey/route.ts` x3, `journey/router.ts`,
`journey/path/pattern.ts`).

That leaves the rest of the ~48-row population. Remaining rows by file, all in
`scripts/api-compare/call-mismatches-exclude/`:

- actioncontroller (24): `metal/strong-parameters.json` (7),
  `metal/params-wrapper.json` (4), `renderer.json` (3), `base.json` (3),
  `test-case.json` (2), `metal/live.json` (1), `metal/data-streaming.json` (1),
  `log-subscriber.json` (1)
- actiondispatch (9 left): `system-testing/driver.json` (2),
  `testing/test-request.json`, `testing/integration.json`,
  `testing/assertions/routing.json`, `routing/route-set.json`,
  `middleware/ssl.json`, `middleware/flash.json`, `http/parameters.json`
- activemodel (6): `attribute-set/builder.json` (3),
  `validations/comparability.json` (2), `errors.json` (1)
- activerecord (3): `reflection.json`, `locking/optimistic.json`,
  `connection-adapters/abstract/database-statements.json`
- rack (2): `utils.json`, `headers.json`
- trailties (1): `application.json`

**The receiver caveat still governs.** `merge` is `Hash#merge` in some of these
and `ActiveRecord::Relation#merge` in others — `activerecord/locking/optimistic.ts
:: _query_constraints_hash` is the worked example of a row to leave baselined
until its Ruby receiver is proven. Adjudicate every row against its Ruby call
site before converging it.

The receiver-as-first-argument shape flags the call-ARGUMENT gate at some sites
(Ruby's `hash.delete_if { }` is 0 args, the TS call passes two). The settled fix
is a `@missingRailsArgs <ruby_call> — PERMANENT` tag on the enclosing method, as
used on `journey/route.ts :: requirements` and `journey/router.ts :: recognize`.

## Acceptance criteria

- Every remaining row above is either converged onto the `@blazetrails/ruby-compat`
  Hash export or left baselined with a per-site reason naming its Ruby receiver.
- No Rails `core_ext` Hash method is moved (`deep_transform_keys`,
  `deep_transform_keys!`, `reverse_merge` stay in activesupport).
- No `Relation#merge` call site is converged onto the Hash export.
- Converged rows are deleted from the baseline by hand, sorted, via
  `serializeBaseline` — only-shrink, never `--write`, never a reseed; stale
  high-water marks narrowed with `pnpm parity:api:calls:tighten`.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params`, `parity:api:extra` green; every touched package's suite
  green and all three AR lanes green.
- This is larger than one PR at 45 rows across six packages: ship the packages
  that fit under the ceiling and file the rest as a further follow-on. Do not
  fan out sibling PRs and do not stack branches.
