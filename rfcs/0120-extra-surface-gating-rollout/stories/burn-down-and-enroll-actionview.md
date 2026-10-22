---
title: "burn-down-and-enroll-actionview"
status: done
updated: 2026-10-22
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9201
claim: "2026-10-21T23:41:24Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

actionview carries **no row in `scripts/api-compare/extra-surface-mark.json`**,
so `pnpm parity:api:extra:gate` does not gate it: its verdict line (forced run,
2026-10-20) names abstractcontroller, actioncontroller, actiondispatch,
activemodel, activerecord, arel, i18n, rack, ruby-compat, thor and others, and
not actionview. Extra surface there is measured and reported only, which means
a new public name with no Ruby counterpart can land green.

`pnpm parity:api:extra --package actionview` reports **25 novel names**, led by
the DOM-testing tree:

| TS file                                                           | novel  | moved |
| ----------------------------------------------------------------- | ------ | ----- |
| `testing/selector-assertions.ts`                                  | 5      | 0     |
| `testing/selector-assertions/html-selector.ts`                    | 3      | 4     |
| `render-context.ts`                                               | 2      | 7     |
| `testing/selector-assertions/substitution-context.ts`             | 2      | 2     |
| `buffers.ts`                                                      | 2      | 0     |
| `helpers/sanitize-helper.ts`                                      | 2      | 0     |
| `testing/dom-assertions.ts`                                       | 2      | 0     |
| `helpers/form-helper.ts`, `template/handlers.ts`, `view-paths.ts` | 1 each | 0     |

plus ~25 moved names (`base.ts` 6, `template.ts` 3, `routing-url-for.ts` 2, …).
Most of the novel count sits in files marked `[no Rails counterpart]`, which
score against an empty allowed set.

This is the same shape as the `burn-down-and-enroll-<package>` stories already
in this RFC (`burn-down-and-enroll-i18n`, est 400, `done`;
`burn-down-and-enroll-abstractcontroller`;
`burn-down-and-enroll-activerecord`), and enrollment is only-grow by
construction.

## Acceptance criteria

- Each of the 25 novel names is deleted, folded into a ported method, or
  receipted `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` at its
  declaration.
- actionview gets a row in `scripts/api-compare/extra-surface-mark.json` and
  `pnpm parity:api:extra:gate` names it in the OK line.
- The moved names are triaged too: a moved extra is a name Rails defines in
  another `.rb`, and nothing else in the repo catches that relocation.
- Per RFC 0120 this is a reviewed enrollment step, not a mechanical one — the
  PR body states which regime (row / pinned / rowless) actionview enters.
