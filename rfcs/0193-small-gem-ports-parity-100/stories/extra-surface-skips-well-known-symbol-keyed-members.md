---
title: "parity:api:extra scores well-known-Symbol-keyed members as novel public surface"
status: closed
updated: 2026-10-18
rfc: "0193-small-gem-ports-parity-100"
cluster: comparer
packages: [rack]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: well-known-Symbol members are meant to be scored. trails CLAUDE.md § '$! is passed explicitly, and a response body is iterated async' says the Symbol.asyncIterator / Symbol.iterator protocol members serving a Rails each carry @noRailsEquivalent PERMANENT receipts, and ~dozens of such receipts exist (actionpack response.ts, cookies.ts, rack body-proxy.ts). The three rack names were resolved directly in the bundle PR instead of folded: files.ts [Symbol.iterator] and query-parser.ts static [Symbol.hasInstance] (the sanctioned is_a? port) receipted PERMANENT; response.ts [Symbol.for('[]')] deleted, since nothing in ruby-compat dispatches through that key and Response#get already ports Rack::Response#[] (alias of get_header, response.rb:177)."
---

## Context

`pnpm parity:api:extra --package rack` (trails `31c40b1da4`) lists `[Symbol.iterator]` (`files.ts`), `[Symbol.hasInstance]` (`query-parser.ts`) and `[Symbol.for("[]")]` (`response.ts`) as **novel** extra surface. trails CLAUDE.md § "Ruby protocol methods with a different JS mechanism" sanctions `static [Symbol.hasInstance]` as the port of `is_a?`, and § "Module mixins" treats symbol-keyed members as not public string-named members. The extractor is `scripts/api-compare/extract-ts-api.ts`, scored by `scripts/api-compare/extra-surface.ts`.

## Acceptance criteria

- [ ] Confirm whether a computed well-known-Symbol key (`Symbol.iterator`, `Symbol.hasInstance`, `Symbol.asyncIterator`) is meant to be scored. If it is (for example, because `Symbol.iterator` stands in for a Ruby `each` that should be credited by name instead), close this story `FALSIFIED:` and fold those three names into `rack-extra-surface-outside-headers-to-zero`.
- [ ] Otherwise, the extractor drops symbol-keyed members from the measured surface, with a test in `scripts/api-compare/`.
- [ ] `Symbol.for("[]")` is decided explicitly: it is ruby-compat's `[]` dispatch key, so it is either credited as Ruby `[]` or dropped.
- [ ] No gate changes verdict, and no mark is raised.
