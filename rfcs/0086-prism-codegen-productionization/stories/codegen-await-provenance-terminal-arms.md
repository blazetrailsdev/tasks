---
title: "Exclude non-falling-through arms from await provenance merge"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 5837
claim: "2026-08-01T23:16:01Z"
assignee: "codegen-await-provenance-terminal-arms"
blocked-by: null
closed-reason: null
---

## Context

PR #5832 made async provenance tracking branch-sensitive: each arm of an
`if`/`case`/`while`/`begin` emits against a scoped copy of the binding set
(`scopeAsyncArm`), and `mergeAsyncArms` keeps an addition only when the branch
is exhaustive and every arm establishes it
(`scripts/prism-codegen/await-policy.ts`, wired in
`scripts/prism-codegen/handlers/control.ts`).

The merge treats every arm as a path that reaches the code after the construct.
An arm that ends in `return`, `next`, `break`, or `raise` does not:

```ruby
def load_all(flag)
  if flag
    return nil
  else
    @relation = build_relation()
  end
  @relation.load
end
```

Only the else arm can reach `@relation.load`, so the await is legitimate, but
the merge intersects both arms and drops the binding. Same shape for a `when`
arm that returns, and for the eager-retraction direction: a retraction in an
arm that cannot fall through still drops a live binding.

Purely a missed-await (safe) direction — never a false positive — but it costs
real awaits once `codegen-apply-scaffolding` output is applied, and Rails
guard-clause style makes the shape common.

## Acceptance criteria

- An arm whose statements end in `return`/`next`/`break`/`raise` is excluded
  from the `mergeAsyncArms` intersection, in both the addition and the eager
  retraction direction.
- A branch whose every arm is non-falling-through leaves the enclosing bindings
  untouched.
- Tests cover: `if`/`else` with a returning then-arm (awaited after), a `when`
  arm that returns, and a returning arm carrying a retraction.
- Goldens regenerated; `pnpm codegen:score` matched count does not regress.
