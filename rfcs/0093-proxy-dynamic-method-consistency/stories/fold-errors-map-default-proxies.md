---
title: "Fold duplicate errors.ts Map-default proxies into one helper"
status: done
updated: 2026-08-07
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: 6196
claim: "2026-08-07T20:00:40Z"
assignee: "fold-errors-map-default-proxies"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/errors.ts:171` (`messages`) and `:200` (`details`)
each wrap a fresh `Map` in a byte-identical Proxy whose `get` trap overrides
only `get` to return the frozen `EMPTY_ARRAY` singleton on a missing key
(Rails `hash.default = EMPTY_ARRAY`, `errors.rb:268-273` / `:276-284`) and
binds every other Map method to the raw target (Map internal slots require the
real receiver). The two traps are duplicates that can only drift apart.

## Acceptance criteria

- One local helper (e.g. `mapWithDefault(map, EMPTY_ARRAY)`) in `errors.ts`
  used by both getters; no behavior change. The helper carries
  `@noRailsEquivalent` (it is the JS spelling of `hash.default`).
- Correctly no `has` trap: Ruby `hash.default` does not make `key?` true.
- Existing errors tests stay green; `pnpm parity:api:extra --package activemodel`
  clean.
