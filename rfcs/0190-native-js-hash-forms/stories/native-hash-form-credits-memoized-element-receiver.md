---
title: "The call gate names a (@h[k] ||= {}) receiver so Thor's assign_result! merge! is Object.assign"
status: in-progress
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8929
claim: "2026-10-15T12:23:10Z"
assignee: "native-hash-each-pair-sites"
blocked-by: null
closed-reason: null
---

## Context

trails#8811 moved `merge!` on a plain object onto `Object.assign`. One site stayed on `mergeBang` only because the call gate cannot credit the native form there:

- `packages/trailties/src/thor/parser/options.ts:268` (`assignResultBang`), porting `(@assigns[option.human_name] ||= {}).merge!(result)` (`vendor/thor/v1.3.2/lib/thor/parser/options.rb:191`). Receiver and argument are plain objects and no block is passed, so RFC 0190 § "Per-name decisions" calls for `Object.assign`.

The Ruby extractor records that site's receiver name as `"?"` with kind `expr` (`callReceiverNames["merge!"]` in `scripts/api-compare/output/rails-api.json`), because the receiver is a parenthesised `||=` over an element reference. `hasNativeFormAnalogue` (`scripts/api-compare/compare.ts`) requires every Ruby site's receiver to be named for a `named: true` row, so `@assign` never credits and the substitution reds `parity:api:calls`. On the TS side `receiverTailName` (`scripts/api-compare/extract-ts-api.ts`) also returns `undefined` for `(this.assigns[k] ??= Object.create(null))`.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` names a receiver of the shape `(x[k] ||= {})` / `(@x[k] ||= {})` by the collection it indexes (`@assigns`), and `receiverTailName` names `(this.x[k] ??= …)` as `x`, each with a test in `scripts/api-compare/`; a form on a different collection still flags.
- [ ] `packages/trailties/src/thor/parser/options.ts` `assignResultBang` writes `Object.assign(...)` and drops its `mergeBang` import.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no baseline row and no `@missingRailsCall` receipt; any row the wider naming makes stale is deleted by hand and tightened.
- [ ] `pnpm vitest run packages/trailties/src/thor/parser` passes.
