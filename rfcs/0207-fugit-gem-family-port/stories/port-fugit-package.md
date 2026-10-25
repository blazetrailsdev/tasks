---
title: "Port fugit as @blazetrails/fugit from generated output to 100%"
status: in-progress
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: fugit-family
packages: ["fugit", "ruby-compat"]
deps:
  [
    "vendor-fugit-gem-family-sources",
    "port-raabro-package",
    "port-et-orbi-package",
    "port-chronic-package",
  ]
deps-rfc: []
est-loc: 11000
priority: null
pr: trails#9312
claim: "2026-10-25T19:29:39Z"
assignee: "port-fugit-package"
blocked-by: null
closed-reason: null
---

## Context

fugit 1.11.1 (`vendor/fugit/v1.11.1/lib/fugit`) parses cron strings, durations and natural-language schedules. solid_queue's `RecurringTask` needs it (`vendor/solid_queue/v1.1.3/app/models/solid_queue/recurring_task.rb:52-58,111-115,159-161`). This story supersedes `vendor-and-port-fugit-cron` (the `0196-solid-stack` RFC), which asked for a cron-only subset. When this merges, close that story as superseded and retarget `port-solid-queue-scheduler-and-recurring-tasks` to depend on this one.

Generated at `f3bcba7e81`, it is 11 files with 6,768 non-blank lines, and its specs come to 2,756 lines. 757 tsc errors. 825 passing and 481 failing before the Duration fixes, and `duration_spec.rb` alone is now 141 of 155. Known failure clusters are `reduce(...).toA` in nat (about 120), `isMatch` missing from ruby-compat (63), `Array#product` (37), Float formatting (`-5s` for Ruby's `-5.0s`), and zero durations printing `""`. `Fugit::Cron#brute_frequency` walks a year of minutes: Ruby takes 62 s, and the spike takes about 1.2 ms per `next_time`, roughly 10 minutes in total. It must pass, so `next_time` needs to get faster or the example needs a raised `testTimeout`, whichever is faithful. ruby-compat additions the spike made for fugit (`numericDiv`, `f3bcba7e81`) ship in this PR.

## Acceptance criteria

- [ ] `packages/fugit/` ships with `src/` checked in, started from the generator's output and finished by hand under trails CLAUDE.md (Ruby names and control flow, no invented surface). `codegen-declined.ts`, `codegen-runtime.ts` stubs and generator scaffolding are gone.
- [ ] `pnpm typecheck` is clean, tests included.
- [ ] Every `vendor/fugit/v1.11.1/spec/*_spec.rb` file is ported as vitest next to its source under the Ruby test names, and the whole suite passes. Any `it.skip` carries a `PERMANENT-SKIP:` that cites a ratified trails CLAUDE.md section.
- [ ] parity reports 100% for `fugit` on API methods, files, arity, params, calls, call args and tests. The package is in `NAMING_ENROLLED_PACKAGES` and rowless in the extra-surface gate, and no baseline row is added.
- [ ] CI is green and the PR is merged.

## How to start

Generate the package on the spike branch `codegen-native-inference` (commit `f3bcba7e81` or later) in a scratch worktree:

```sh
CODEGEN_GEM=fugit pnpm tsx scripts/codegen/src/cli.ts --tests at_spec.rb,cron_spec.rb,duration_spec.rb,nat_spec.rb,parse_spec.rb
SWAP_GENERATED_TESTS=1 CODEGEN_GEM=fugit scripts/codegen/swap-tree.sh
```

Copy `packages/fugit/codegen-out/src` into this story's branch from `main`, along with the package scaffolding from the spike (`package.json`, `tsconfig.json`). From then on the tree is hand-owned. Do not commit generator changes in this PR. If the generator has a bug, note it in the PR body.
