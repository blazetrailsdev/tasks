---
title: "Converge live tsc-plugin attribute() declares to nullable (match baked generator)"
status: draft
updated: 2026-06-25
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4115 (story `materialize-declares-nested-generator-gaps`) introduced a
deliberate divergence between the two declare-rendering paths:

- The **materializing generator**
  (`packages/activerecord/scripts/materialize-model-declares.ts`) now passes
  `attributesNullable: true`, so baked `this.attribute("content", "string")`
  declares render `declare content: string | null;` (Rails attributes carry
  no NOT NULL constraint and accept `null` assignment).
- The **live tsc-plugin / `virtualize` default**
  (`packages/activerecord/src/type-virtualization/synthesize.ts`
  `renderAttribute`, gated by `SynthesizeOptions.attributesNullable ?? false`)
  still renders the bare `declare content: string;`.

Consequence: in the IDE the live plugin types an attribute non-null, so
`t.content = null` shows a phantom TS2322 error that the _baked_ source does
not have. The two surfaces disagree on the same model.

This was scoped out of #4115 to keep the blast radius small — flipping the
default flips ~18 pinned assertions in
`packages/activerecord/src/type-virtualization/virtualize.test.ts` and
changes live IDE behavior for every attribute() declare.

Relevant code:

- `synthesize.ts` `renderAttribute(call, nullable)` + `SynthesizeOptions.attributesNullable`
- `virtualize.ts` `VirtualizeOptions.attributesNullable`
- `virtualize.test.ts` attribute-declare assertions (`declare X: string;` etc.)

## Acceptance criteria

- [ ] Decide the converged behavior (recommend: live plugin also renders
      `attribute()` declares as `T | null`, matching Rails' nullable-by-default
      attributes and the baked output).
- [ ] Update the live default in `synthesize.ts`/`virtualize.ts` and the
      pinned `virtualize.test.ts` assertions accordingly.
- [ ] Live-plugin and generator output for attribute() declares match.
- [ ] No phantom TS2322 in the IDE for `model.attr = null`.
