---
title: "The promise gate counts a dropped maybe-promise (PromiseLike<T> | T) return"
status: draft
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10035 seeded `scripts/parity/promise-count-mark.json` from upstream
`@typescript-eslint/no-floating-promises` with `ignoreVoid: false`. Upstream
does not treat a union return such as `PromiseLike<void> | void` as thenable,
so a dropped or voided maybe-promise is never a finding. Probed in
`eslint/promise-rule-prefilters.test.mjs` on trails#10035:
`declare function maybeLater(): PromiseLike<void> | void; void maybeLater();`
reports nothing, while `void later()` (`Promise<void>`) reports `floating`.
The prefilter (`eslint/promise-rule-prefilters.mjs`) is not the cause: it hands
every `void` statement to upstream.

The largest instance is `resetColumnInformation`
(`packages/activerecord/src/model-schema.ts:418`, typed
`PromiseLike<void> | void`), about 120 `void X.resetColumnInformation()` sites
in activerecord tests; this is most of the gap between the RFC's regex estimate
(activerecord tests 298) and the seeded activerecord count (33). So
`reset-column-information-is-awaited`'s criterion "activerecord's `floating`
mark drops by the converged count" cannot hold today.

## Acceptance criteria

- [ ] A dropped or voided call whose return type has any thenable union member is a finding: `blazetrails/no-floating-maybe-promise` beside upstream, or the prefilter wrapper reporting the arm upstream skips, counted by `pnpm parity:promises` (`scripts/parity/promise-count.ts` `RULES`).
- [ ] RuleTester covers `PromiseLike<void> | void`, `Promise<T> | T`, and a union with no thenable member (valid).
- [ ] The new findings are seeded into `promise-count-mark.json` in the same PR, the PR body stating the per-package counts.
- [ ] `reset-column-information-is-awaited`'s mark criterion names the rule that counts its sites.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
