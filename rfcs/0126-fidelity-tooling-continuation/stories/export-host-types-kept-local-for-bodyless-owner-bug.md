---
title: "Export the host types #6798 kept local to dodge the bodyless-owner bug"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Export the host types #6798 kept local to dodge the bodyless-owner bug

## Context

PR #6798 (`retire-activemodel-this-rebinding-thunks`) shipped its host types
**non-exported** — and said so in the PR body — purely because an exported
interface member outranked the real body in call-parity pairing and silently
retired the baselined rows for the method. PR #7154 fixed that
(`MethodInfo.bodyless` + `ownersWithBodies` in `scripts/api-compare/compare.ts`),
and verified the rows now flag rather than staling by re-adding
`attributeMethodPatternsCache` / `resolveAttributeName` to the exported
`AttributeMethodHost` in `packages/activemodel/src/attribute-methods.ts` and
watching both gates stay green.

The workaround is now debt with no cause. `AttributeMethodsHost` in
`packages/activerecord/src/attribute-methods.ts:113` is still `interface` with
no `export`, and it is the host type every `this`-typed function in that file
names — the trails mixin idiom CLAUDE.md ("Module mixins") documents, whose
whole point is that the host contract is readable by the file's consumers.

## Converged shape

Export the host types that were kept local for this reason, starting with
`AttributeMethodsHost` (activerecord) — audit the sibling files #6798 touched
for the same shape. Rails' counterpart is the module itself
(`activerecord/lib/active_record/attribute_methods.rb:14`,
`activemodel/lib/active_model/attribute_methods.rb:73`): a Ruby `module` is
public, so the port's host contract should be too.

## Acceptance criteria

- [ ] The host types #6798 kept local for the tooling bug are exported.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green with NO row
      going stale — a staling row means the fix regressed, not that the row
      converged.
- [ ] `pnpm parity:api:extra` non-negative: an exported type's members enter the
      measured surface, so any member with no Ruby counterpart needs a
      `@noRailsEquivalent PERMANENT|CONVERGEABLE` receipt.
