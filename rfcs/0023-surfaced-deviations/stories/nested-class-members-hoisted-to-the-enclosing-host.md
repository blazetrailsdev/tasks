---
title: "Converge the 19 nested-class members trails declares on the wrong host (ungated packages)"
status: ready
updated: 2026-09-01
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7238 (RFC 0126,
`extra-surface-nested-class-method-allowance-is-file-wide`) scoped a nested Ruby
class's method allowances to the TS declaration that ports it, instead of
unioning them into the flat per-file allow-set. That surfaced 19 pre-existing
divergences in packages the extra-surface ratchet does not gate: a name Rails
declares ONLY on a nested class, appearing in trails on the enclosing class or
at file scope.

`activerecord` (gated) surfaced four of its own, already filed as
`migration-current-nested-class-holds-table-overrides`. `trailties`'
source-annotation registrars are filed as
`source-annotation-registrars-belong-on-annotation`. This story is the rest.

Measured before -> after on the merge commit (`novel` unchanged everywhere; all
of the movement is `moved`, i.e. the name IS Rails', just on another host):

| package          | total extras before | after |
| ---------------- | ------------------- | ----- |
| rack             | 109                 | 115   |
| actiondispatch   | 284                 | 287   |
| trailties        | 262                 | 266   |
| actionview       | 109                 | 111   |
| actioncontroller | 124                 | 125   |

The exact rows, from `pnpm parity:api:extra --package <pkg>`:

- `rack` — `auth/basic.ts` (`basic`, `credentials`, `username`),
  `multipart/parser.ts` (`close`, `isFile`), `rewindable-input.ts` (`call`)
- `actiondispatch` — `http/response.ts` (`isClosed`),
  `routing/route-set.ts` (`clear`, `serve`)
- `trailties` — `generators/app-base.ts` (`options`), plus the three registrars
  covered by the sibling story
- `actionview` — `renderer/streaming-template-renderer.ts` (`constructor`,
  `each`)
- `actioncontroller` — `metal/request-forgery-protection.ts` (`write`)

Each is the same shape and each needs the same treatment: read the Ruby, find
the nested class that declares the name, and move the TS member onto the
declaration that ports that nested class. A few may instead turn out to be a
missing nested-class port (no TS declaration exists for the Ruby nested class at
all), which is the same convergence with a larger diff.

Do NOT close this by tagging the names `@noRailsEquivalent`: they have Rails
counterparts, just on another host, so a receipt would be recording the
deviation rather than converging it.

## Acceptance criteria

- Each row above is either converged — the member moves to the TS declaration
  porting the Ruby nested class that declares it, at the Rails name — or, where
  the Ruby name genuinely is not declared on a nested class, shown to be a
  scorer false positive with the Rails `file:line` that proves it.
- `pnpm parity:api:extra` shows each package's total extras fall by the count
  above; `novel` does not rise for any package.
- `pnpm parity:api` delta is non-negative for every package touched.
- Split across several PRs if the LOC ceiling requires; file the remainder as
  sibling stories rather than fanning out PRs.
