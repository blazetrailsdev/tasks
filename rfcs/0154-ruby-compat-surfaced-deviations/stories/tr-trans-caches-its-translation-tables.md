---
title: "tr-trans-caches-its-translation-tables"
status: claimed
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-10-27T14:48:41Z"
assignee: "tr-trans-caches-its-translation-tables"
blocked-by: null
closed-reason: null
---

## Context

`trTrans` (`packages/ruby-compat/src/string/tr.ts:56`) rebuilds its
translation tables on every call: it re-splits `src` and `repl` into code
points, re-expands ranges through `trnext`, and builds a fresh `Map` and `Set`,
before scanning `str`. MRI's `tr_trans` (`vendor/ruby/v3.3.11/string.c`) also
builds per call, but over a 256-entry C array, so the cost is negligible there.

The hot caller is builder's escaping: `XChar` runs
`trTrans(unicode(string), CP1252_DIFFERENCES, UNICODE_EQUIVALENT, false)`
(`packages/builder/src/xchar.ts:117`) for every escaped text and attribute
value, always with the same two constant tables.

Measured 2026-10-27, plain Node 24 on the built `dist` (not under vitest):
50,000 `XmlMarkup` tags take ~1.7s (~35µs/tag, against ~4ms for equivalent
string concatenation). A CPU profile attributes ~60% of that to `trTrans` plus
its `trnext` / table helpers (`tr.js:54`, `:65`, `:9`); the `XmlBase` Proxy
`get` trap is ~8%.

## Acceptance criteria

- `trTrans` caches its compiled tables (`trans`, `members`, `last`, `cflag`)
  keyed on the `(src, repl)` string pair, so a repeated pair skips table
  construction. A bounded cache is fine; output is byte-identical.
- Existing `tr` / `tr_s` tests pass unchanged; add one covering a repeated
  pair and a range/negated (`^`) source hitting the cache.
- Re-run the 50,000-tag builder measurement under plain Node and record the
  before/after in the PR; `trTrans` should no longer dominate the profile.
