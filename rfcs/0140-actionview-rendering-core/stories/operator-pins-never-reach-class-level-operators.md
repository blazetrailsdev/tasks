---
title: "operator-pins-never-reach-class-level-operators"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`) resolves a
Ruby operator to the TS spelling its port uses, so the ported operator sorts into its Rails
slot in the method-ORDER manifest and does not read as extra surface in
`parity:api:extra`. It only ever reaches INSTANCE methods:

- `scripts/build-rails-file-structure-manifest.ts:274` —
  `const opCandidates = m.isStatic ? undefined : operatorSpelling(host.fqn, m.name);`
- `scripts/build-rails-file-structure-manifest.ts:301` — the same guard for mixin members.

Every operator pinned today happens to be an instance method, so the gap has never
surfaced. It surfaces the moment a class-level operator is ported.

The live instance is `ActionView::Template::SimpleType#[]`
(`vendor/rails/actionview/lib/action_view/template/types.rb:14`, declared inside
`class << self` at `:13-24`). PR #7636 ports it as `Types.get`
(`packages/actionview/src/template/types.ts`), because `RawFile#initialize` reads
`Template::Types[extname].symbol` (`template/raw_file.rb:12-13`).

The Ruby API extract DOES record it — `rails-api.json` carries
`ActionView::Template::SimpleType` with `"classMethods": [ ..., {"name": "[]", "line": 14},
... ]` — so the data is present; only the lookup skips it. Registering the entry therefore
fails the builder's own dead-entry guard:

```text
Error: [build-rails-file-structure-manifest] 1 dead OPERATOR_SPELLING_BY_FQN entry
(fqn/operator absent from the Ruby API): ActionView::Template::SimpleType#[] — fix the fqn
or drop the entry (scripts/api-compare/operator-order-spelling.ts).
```

With no pin available, `pnpm parity:api:extra --package actionview` scores `get` as one
`moved` name that cannot be converged from the port's side:

```text
  template/types.ts — 0 novel, 1 moved
    get
```

`actionview` is not in `GATED_PACKAGES`, so today this is report-only. It becomes a red the
day actionview enrols, and it already inflates that package's burndown baseline with a name
that is a faithful port.

Note the sibling entry `ActionView::Template::SimpleType#==` (`types.rb:39`) pinned by
PR #7636 DOES resolve — it is an instance method — which is the direct evidence that the
static half is the only thing missing.

## Acceptance criteria

- `operatorSpelling` is consulted for class-level operators as well as instance ones, in
  both `build-rails-file-structure-manifest.ts` call sites.
- `OPERATOR_SPELLING_BY_FQN` gains `"ActionView::Template::SimpleType": { "[]": ["get"] }`
  and the builder's dead-entry guard accepts it.
- `pnpm parity:api:extra --package actionview` no longer lists `get` under
  `template/types.ts`.
- `scripts/api-compare/operator-order-spelling.test.ts` covers a static-operator
  resolution, so the instance-only assumption cannot come back silently.
- No other package's extra-surface or method-order numbers move; if one does, the change
  is a genuine correction and the moving rows are named in the PR body.
