---
title: "parity:api arity report reads aliasParams for a declared static alias"
status: done
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8489
claim: "2026-10-04T16:08:08Z"
assignee: "port-thor-util"
blocked-by: null
closed-reason: null
---

## Context

A Ruby class-level `alias_method` is ported as `static declare x: typeof Klass.y;` at the Rails line plus
`Klass.x = Klass.y;` after the class body. `scripts/api-compare/extract-ts-api.ts:4084` records such a member
with `params: []` and the target's signature under `aliasParams`.

The advisory arity report compares `params`, so when the Ruby extractor has resolved the alias
(`aliasResolved`, `scripts/api-compare/arity.ts:299-312`) the pair is flagged `ruby(name, options = …)
ts()`. After trails#8475, `parity:api --package thor --arity` lists three such rows for
`packages/trailties/src/thor/thor.ts`: `option`, `subtask` and `subtaskHelp`
(`vendor/thor/v1.3.2/lib/thor.rb:175,344,647`). The other six aliases in the file are not flagged only
because their Ruby side is unresolved. The arity gate (`parity:api:arity`) is green, so nothing blocks, but the
thor arity figure reads 204/208 where the bodies agree.

## Acceptance criteria

- [ ] The arity comparison reads `aliasParams` for a TS alias member whose `params` is empty.
- [ ] `parity:api --package thor --arity` no longer lists `option`, `subtask` or `subtaskHelp`.
- [ ] A `scripts/api-compare` test covers a `static declare` alias against a resolved Ruby alias.
