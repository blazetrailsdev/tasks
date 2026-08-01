---
title: "Scope async provenance tracking to branch flow"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5832
claim: "2026-08-01T22:16:00Z"
assignee: "codegen-await-provenance-branch-sensitivity"
blocked-by: null
closed-reason: null
---

## Context

PR #5828 added per-def async provenance tracking for await insertion
(`asyncBindings` in `scripts/prism-codegen/handlers/expressions.ts` +
`scripts/prism-codegen/await-policy.ts`). Tracking is _flow-insensitive_: it
records a key when the write node is emitted and retracts on any rebind that
carries no provenance, in pure emission order.

That is sound for straight-line code but not for branches. Given:

```ruby
def load_all(flag, arg)
  @relation = arg
  if flag
    @relation = build_relation()
  end
  @relation.load
end
```

the write inside the `if` marks `@relation` provenanced, and the trailing
`@relation.load` earns an await even though the branch may not have run — a
spurious await in a possibly-sync path, the exact false positive PR #5822
narrowed the policy to avoid.

The inverse also holds: a retraction inside a not-taken branch drops a binding
that is still valid, costing a legitimate await.

No occurrence in the current corpus (goldens were byte-identical across #5828),
so this is latent, but it matters once `codegen-apply-scaffolding` output is
actually applied.

## Acceptance criteria

- A write inside a conditional/loop body does not leak provenance to code after
  the construct, unless every arm establishes it.
- A retraction inside a branch is likewise scoped, or conservatively applied
  (retraction may stay eager — dropping an await is the safe direction).
- Tests cover: assignment in an `if` with no `else` (bare after), assignment in
  both arms of an `if`/`else` (awaited after), and retraction in one arm.
- Goldens regenerated; `pnpm codegen:score` matched count does not regress.
