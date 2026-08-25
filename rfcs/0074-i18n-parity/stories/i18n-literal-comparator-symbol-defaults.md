---
title: "Literal comparator: Ruby Symbol default vs colon-prefixed TS string"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6048
claim: "2026-08-04T03:25:54Z"
assignee: "i18n-literal-comparator-symbol-defaults"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports exactly one literal mismatch repo-wide, and it is the
colon spelling this RFC just adopted:

```json
{
  "rubyFile": "backend/base.rb",
  "tsFile": "backend/base.ts",
  "name": "format",
  "rubyValue": "\"default\"",
  "tsValue": "\":default\"",
  "kind": "default"
}
```

`vendor/i18n/lib/i18n/backend/base.rb` declares
`def localize(locale, object, format = :default, options = EMPTY_HASH)`;
`packages/i18n/src/backend/base.ts:265` correctly spells that Symbol default as
`":default"` per CLAUDE.md ("Symbols vs strings" — a Symbol value keeps its
leading colon). The extractor renders the Ruby Symbol as bare `default`, so the
correct port scores as a divergence — a comparator gap, not a port defect.
Story `i18n-symbol-values-are-colon-strings` (done) converged the code; nothing
taught the literal comparator about the convention, and every future Symbol
default will add another false row.

## Acceptance criteria

- The literal comparator (`scripts/api-compare/compare.ts` literals pass, with
  the Ruby-side value produced by `scripts/api-compare/extract-ruby-api.rb`)
  treats a Ruby Symbol default `:x` as equal to the TS string `":x"` — and
  still reports a mismatch when TS spells it bare `"x"`.
- A unit test covers both directions (`:default` vs `":default"` matches;
  `:default` vs `"default"` mismatches).
- `pnpm parity:api` reports 0 literal mismatches for i18n.
