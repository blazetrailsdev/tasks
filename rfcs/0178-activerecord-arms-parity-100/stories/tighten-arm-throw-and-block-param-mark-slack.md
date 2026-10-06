---
title: "parity: tighten the arm-throw and block-param marks sitting above current"
status: in-progress
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#8561
claim: "2026-10-05T23:39:34Z"
assignee: "port-params-wrapper-tests"
blocked-by: null
closed-reason: null
---

## Context

Two only-shrink gates print "mark is above the current" notes on main (seen on trails#8547's branch point and
unchanged by it), so slack is sitting under them:

- `pnpm parity:api:arms:throws`: trailties total mark 2 vs current 0
  (`generators/rails/model/model-generator.ts` mark 2 vs 0), `scripts/api-compare/arm-throw-mark.json`.
- `pnpm parity:api:blocks`: actiondispatch total 44 vs 43 (`middleware/stack.rb` 6 vs 5); actionview total 5 vs 3
  (`renderer/streaming_template_renderer.rb` 2 vs 0); trailties total 8 vs 7 (`railtie/configuration.rb` 1 vs 0),
  `scripts/api-compare/block-param-mark.json`.

Neither gate reds on slack, so a regression of up to the slack would pass.

## Acceptance criteria

- [ ] `pnpm parity:api:arms:throws:tighten` and `pnpm parity:api:blocks:tighten` are run on a fresh
      `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls`, and the two mark files are committed.
- [ ] Both gates print no "is above the current" line.
- [ ] If either gate should red on slack the way `parity:api:calls` reds on a stale high-water mark, file that as its own story rather than widening this one.
