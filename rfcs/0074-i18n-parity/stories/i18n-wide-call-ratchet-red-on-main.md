---
title: "i18n-wide-call-ratchet-red-on-main"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5988
claim: "2026-08-03T16:37:43Z"
assignee: "i18n-wide-call-ratchet-red-on-main"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls` is red on `main` (and therefore on every i18n branch):

```text
  + i18n  backend/simple.ts  store_translations  new  (i18n/backend/simple.json)
  + i18n  backend/simple.ts  translations       new  (i18n/backend/simple.json)
  + i18n  interpolate/ruby.ts interpolate_hash  call (i18n/interpolate/ruby.json)
```

The i18n port (#5980, #5972 era) enrolled the package in `parity:api` but no
`scripts/api-compare/call-mismatches-wide-exclude/i18n/` baseline directory
exists, so the wide ratchet counts these three as NEW. Reproduced locally on a
clean `origin/main` build (stash-and-rerun on PR #5983 gives the identical three
rows with the branch's own commits removed), so it is not caused by any open PR.

Rails sources:

- `vendor/i18n/lib/i18n/backend/simple.rb` — `store_translations`, `translations`
- `vendor/i18n/lib/i18n/interpolate/ruby.rb` — `interpolate_hash`

## Acceptance criteria

- Each of the three rows is CONVERGED — the TS body makes the call Rails makes
  (`Hash.new`/`translations` init in `simple.rb`, the `interpolate_hash` call in
  `ruby.rb`) — not baselined, unless a row is genuinely satisfied by a different
  path, in which case it gets a one-line reviewed `reason` in
  `scripts/api-compare/call-mismatches-wide-exclude/i18n/<file>.json`.
- `pnpm parity:api:calls` is green on the branch.
