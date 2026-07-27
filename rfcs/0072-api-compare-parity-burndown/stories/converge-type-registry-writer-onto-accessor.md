---
title: "Converge or formally accept ActiveRecord::Type.registry= (setRegistry)"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left unconverged by PR #5387
(`converge-ar-class-level-writers-onto-accessors`), which converged the other
three AR class-level writer pairs and documented this one at the call site.

`packages/activerecord/src/type.ts:105` exports `setRegistry`, the writer half
of Rails' `ActiveRecord::Type.registry` accessor
(`vendor/rails/activerecord/lib/active_record/type.rb`, `class << self;
attr_accessor :registry`). `scripts/api-compare/conventions.ts` maps `registry=`
onto the same camelCase name as its reader, so `setRegistry` is TS surface Rails
does not have and shows as `1 novel` in `api:extra` for `type.ts`.

It was excluded from the converging PR for a concrete reason, recorded in the
JSDoc above the function: Rails hangs the accessor off the
`ActiveRecord::Type` **module object**, whose trails analogue is this ES module,
and an ES module namespace is read-only from the importer's side — there is no
object on which to define a getter/setter pair. The three converged siblings were
all class-level, so they could take static accessors installed on `Base`.

Note `setCurrentAdapterResolver` in the same file is the other novel export and
has no Rails counterpart at all; it may want folding into the same decision.

## Acceptance criteria

- Either `ActiveRecord::Type` gains a real object to host the accessor (e.g. an
  exported class module or singleton holding registry state, with module
  functions delegating), removing `setRegistry`; or the deviation is accepted
  with an explicit disposition recorded the way other permanent deviations are.
- No new `extra-surface-allow.json` entry used as a substitute for deciding.
- Only three call sites assign the registry today (`type.test.ts`,
  `type.trails.test.ts`), so churn is small — check before sizing.
- `pnpm api:compare` matched-method count does not regress.
