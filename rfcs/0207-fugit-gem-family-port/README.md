---
rfc: "0207-fugit-gem-family-port"
title: "fugit and its gem family (raabro, et-orbi, chronic) ported from generated output to 100%"
status: active
created: 2026-10-24
updated: 2026-10-24
owner: "@deanmarano"
packages:
  - raabro
  - chronic
  - et-orbi
  - fugit
  - activesupport
  - ruby-compat
  - "scripts"
max-est-loc: 12000
clusters:
  - fugit-family
related-rfcs:
  - "0185-ruby-ts-codegen"
  - "0196-solid-stack"
  - "0193-small-gem-ports-parity-100"
priority: 3
---

# RFC 0207 — fugit and its gem family ported from generated output to 100%

## Summary

Port four floraison/mojombo gems as trails packages: `raabro` (the parser
combinator fugit is written in), `et-orbi` (fugit's time type), `chronic`
(the natural-language date parser fugit and et-orbi call when it is loaded)
and `fugit` (cron, duration and natural-language schedule parsing). solid_queue
needs fugit for `RecurringTask`. Each package starts from the
ruby-ts-codegen generator's output and is finished by hand. It is done when it
has merged with `tsc` at zero errors, the gem's own spec suite ported in full
and 100% green, and 100% on every parity gate the other gem ports are held
to. This is also an experiment: one agent per gem, to see whether generated
output plus one agent session reaches a merged, green, 100% package.

## Motivation

solid_queue's `RecurringTask` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/recurring_task.rb:1-3`,
`:52-58`, `:111-115`, `:159-161`) does `require "fugit"` and calls
`Fugit.parse`, `Fugit::Cron#next_time` and `#previous_time`. Rails' own
`Gemfile.lock` resolves `fugit (1.11.1)`, `et-orbi (1.2.11)` and
`raabro (1.4.0)` (`vendor/rails/v8.0.2/Gemfile.lock:202,234-236,431`).
`vendor-and-port-fugit-cron` (the `0196-solid-stack` RFC) asked for a cron-only
subset. This RFC replaces it with the whole family at 100%.

The generator spike (trails branch `codegen-native-inference`, commit
`f3bcba7e81`, 2026-10-24) already emits all four packages. Their state when
generated and swapped in with `scripts/codegen/swap-tree.sh`
(`SWAP_GENERATED_TESTS=1`, the gem's own specs lowered to vitest):

| Package | Generated src (non-blank lines / files) | Spec lines | tsc errors | Specs passing        |
| ------- | --------------------------------------- | ---------- | ---------- | -------------------- |
| raabro  | 2,883 / 4                               | 1,782      | 292        | 10 / 89              |
| chronic | 7,852 / 40                              | 2,440      | 1,549      | 8 / 98               |
| et-orbi | 3,497 / 10                              | 1,705      | 366        | 82 / 223             |
| fugit   | 6,768 / 11                              | 2,756      | 757        | 825 / 1,306 (and up) |

fugit's figure predates the Duration fixes in `f3bcba7e81`, which took
`duration_spec.rb` from 13 to 141 of 155. One example,
`Fugit::Cron#brute_frequency`, walks a year of minutes and takes Ruby itself
62 s. It times out under vitest, which is a speed problem and not a hang.

## Design

### What each story ships

Each package story branches from trails `main` and ships one PR that adds
`packages/<gem>/` with its `src/` checked in. The generator stays on the spike
branch and is not landed by this RFC. The agent:

1. Checks out the spike branch `codegen-native-inference` in a scratch
   worktree and generates the package (`CODEGEN_GEM=<gem> pnpm tsx
scripts/codegen/src/cli.ts --tests <spec files>`). It copies
   `packages/<pkg>/codegen-out/src` as the starting `src/`.
2. Finishes that tree by hand on its `main` branch, as a hand-owned port.
   From this point it is ordinary trails code under trails CLAUDE.md, with no
   regeneration and no generated-code exemption: Ruby names, Ruby control flow,
   no invented surface. Generator artefacts are removed, not shipped:
   `codegen-declined.ts`, `codegen-runtime.ts` stubs, `as unknown` scaffolding,
   and runtime type-test ladders that a typed port does not need.
3. Puts any ruby-compat or activesupport helper the port needs in that package,
   with its MRI or Rails citation, in the same PR. Where a helper is already on
   the spike branch, it ports that commit. Examples are ruby-compat `numericDiv`
   and the TZInfo stand-in's tzdb link names, `20359b497c`.

An agent that finds a generator bug may note it in its PR body. Fixing the
generator is not part of the story.

### Done means

Every package story has the same acceptance bar:

- `pnpm typecheck` is clean, with the package and its tests included.
- Every spec / test file in the vendored gem is ported as a vitest file next to
  its source. Test names are the RSpec / minitest names, and the whole suite
  passes with no `it.skip` beyond a `PERMANENT-SKIP:` that cites a ratified
  trails CLAUDE.md section.
- The gem is registered in `vendor/sources.ts` and enrolled in `parity:api`
  and `parity:test`. It reads 100% on API methods, files, arity, params, calls,
  call args and tests. It is enrolled in `NAMING_ENROLLED_PACKAGES` and in the
  extra-surface gate as a rowless package, as
  `enroll-rack-test-bcrypt-did-you-mean-in-gates` did for the
  `0193-small-gem-ports-parity-100` gems. No baseline row is added.
- CI is green and the PR merges.

### Order

`vendor-fugit-gem-family-sources` lands first, because all four packages need
`vendor/sources.ts` entries and parity enrollment scaffolding in one shared file.
After it, `raabro` and `chronic` can run in parallel. `et-orbi` needs `chronic`
(its specs load it), and `fugit` needs the other three.

## Non-goals

- **Landing the generator on `main`.** The `0185-ruby-ts-codegen` RFC owns the
  generator. These stories ship packages, and a generator fix found along the
  way is a note, not scope.
- **Making `brute_frequency` as fast as Ruby.** The example has to pass, and a
  faster `next_time` is in scope if that is what it takes. Matching MRI's speed
  for its own sake is not.
- **Re-porting `TZInfo`.** et-orbi and fugit run on activesupport's existing
  TZInfo stand-in. Only what their specs need is added to it.

## Alternatives considered

- **Generator first, then regenerate per gem.** This was rejected by the owner
  (2026-10-24). The generator landing is a large PR that would gate all four
  packages, and the experiment is whether generated output plus one agent gets
  a package to 100%.
- **Agents working on the spike branch.** This was rejected because four agents
  would collide on the same generator files.

## Rollout

1. `vendor-fugit-gem-family-sources`.
2. `port-raabro-package` and `port-chronic-package`, in parallel.
3. `port-et-orbi-package`.
4. `port-fugit-package`. When it is done, close `vendor-and-port-fugit-cron` as
   superseded and point `port-solid-queue-scheduler-and-recurring-tasks` at
   `port-fugit-package`.
