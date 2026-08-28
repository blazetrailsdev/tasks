---
title: "journey/scanner.rb last-segment collision drops all file-structure order"
status: draft
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/build-rails-file-structure-manifest.ts` drops a member-order bucket —
and, since PR #7146, a declaration name — whenever two Ruby classes in one file
share the fqn's last segment, because the rule matches a TS class body to a
bucket by exact name and cannot tell the two apart. The drop is warned, not
silent:

```text
[build-rails-file-structure-manifest] last-segment collision in
actiondispatch/journey/scanner.rb: `Scanner` shared by
ActionDispatch::Journey::Scanner, ActionDispatch::Journey::Scanner::Scanner
— bucket DROPPED (no order enforced).
```

This is the ONLY collision repo-wide as of 2026-08-28 (1012 manifest files),
so converging it retires the whole escape hatch's live population. It comes
from `vendor/rails/actionpack/lib/action_dispatch/journey/scanner.rb`, where
`ActionDispatch::Journey::Scanner` contains a nested `Scanner` — the Ruby
Ripper-based scanner class inside the Journey scanner.

Both `Scanner` entities currently get no member order and no declaration
order enforced in `packages/actionpack/src/actiondispatch/journey/scanner.ts`.

## Acceptance criteria

- The two `Scanner` entities resolve independently: either the nested one takes
  a distinct TS name (the settled trails shape for a nested Rails constant —
  `Arel::Visitors::Dot::Node` → `DotNode`, see the rule's rename fallback), or
  the bucket key stops being the bare last segment.
- `pnpm tsx scripts/build-rails-file-structure-manifest.ts` emits ZERO
  last-segment collision warnings.
- `packages/actionpack/src/actiondispatch/journey/scanner.ts` has real member
  and declaration order enforced against `journey/scanner.rb`, and is green
  under the rule (converging any order it then surfaces).
- The collision escape hatch itself stays — it is structural — but its live
  population goes to zero.
