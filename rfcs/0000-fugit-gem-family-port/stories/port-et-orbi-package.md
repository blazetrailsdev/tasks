---
title: "Port et-orbi as @blazetrails/et-orbi from generated output to 100%"
status: draft
updated: 2026-10-24
rfc: "0000-fugit-gem-family-port"
cluster: fugit-family
packages: ["et-orbi", "activesupport"]
deps: ["vendor-fugit-gem-family-sources", "port-chronic-package"]
deps-rfc: []
est-loc: 6000
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

et-orbi (`vendor/et-orbi/v1.2.11/lib/et-orbi`) provides `EtOrbi::EoTime`, fugit's time type, on top of TZInfo. trails runs it on activesupport's TZInfo stand-in (`packages/activesupport/src/values/time-zone.ts`). Its specs need `Timezone.all` to list tzdb link names, which the spike added in `20359b497c` ("TZInfo stand-in Timezone.all lists tzdb link names (tzdata 2026c)"), plus `Timezone#==`, a `localToUtc` that accepts a `PlainDateTime`, and per-zone caching of the `Intl.DateTimeFormat` objects (`1a9780e236`). Port those activesupport changes in this PR.

Generated at `f3bcba7e81`, it is 10 files with 3,497 non-blank lines, and its specs come to 1,705 lines. 366 tsc errors, 82 of 223 specs passing. Known failures are blocks passed where a function is expected (39), `z.name` (17), `EtOrbi.setChronicEnabled` missing and `chronic_enabled` defaulting to `null` (6), and the spec helper's `Time.zone` stub not being seen because the generated code reads activesupport's `zone()` instead of `Time.zone`.

## Acceptance criteria

- [ ] `packages/et-orbi/` ships with `src/` checked in, started from the generator's output and finished by hand under trails CLAUDE.md (Ruby names and control flow, no invented surface). `codegen-declined.ts`, `codegen-runtime.ts` stubs and generator scaffolding are gone.
- [ ] `pnpm typecheck` is clean, tests included.
- [ ] Every `vendor/et-orbi/v1.2.11/spec/*_spec.rb` file is ported as vitest next to its source under the Ruby test names, and the whole suite passes. Any `it.skip` carries a `PERMANENT-SKIP:` that cites a ratified trails CLAUDE.md section.
- [ ] parity reports 100% for `et-orbi` on API methods, files, arity, params, calls, call args and tests. The package is in `NAMING_ENROLLED_PACKAGES` and rowless in the extra-surface gate, and no baseline row is added.
- [ ] CI is green and the PR is merged.

## How to start

Generate the package on the spike branch `codegen-native-inference` (commit `f3bcba7e81` or later) in a scratch worktree:

```sh
CODEGEN_GEM=et_orbi pnpm tsx scripts/codegen/src/cli.ts --tests eo_time_spec.rb,module_spec.rb
SWAP_GENERATED_TESTS=1 CODEGEN_GEM=et_orbi scripts/codegen/swap-tree.sh
```

Copy `packages/et-orbi/codegen-out/src` into this story's branch from `main`, along with the package scaffolding from the spike (`package.json`, `tsconfig.json`). From then on the tree is hand-owned. Do not commit generator changes in this PR. If the generator has a bug, note it in the PR body.
