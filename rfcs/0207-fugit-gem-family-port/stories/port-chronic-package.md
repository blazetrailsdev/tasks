---
title: "Port chronic as @blazetrails/chronic from generated output to 100%"
status: in-progress
updated: 2026-10-24
rfc: "0207-fugit-gem-family-port"
cluster: fugit-family
packages: ["chronic"]
deps: ["vendor-fugit-gem-family-sources"]
deps-rfc: []
est-loc: 11000
priority: null
pr: trails#9286
claim: "2026-10-24T19:14:02Z"
assignee: "port-chronic-package"
blocked-by: null
closed-reason: null
---

## Context

chronic 0.10.2 (`vendor/chronic/v0.10.2/lib/chronic`) is the natural-language date parser. fugit's `Nat` and et-orbi call it when it is loaded, and their specs load it (fugit's `(Chronic and ActiveSupport, gh-11)` example). Generated at `f3bcba7e81`, it is 40 files with 7,852 non-blank lines, and its tests come to 2,440 lines. 1,549 tsc errors, 8 of 98 tests passing. It is the least finished of the four. On the spike, nested classes are seated on the `Chronic` root (`Chronic.Handler` and friends, read at call time) to break an import cycle, as trails CLAUDE.md § "Call-time constant resolution" sanctions.

## Acceptance criteria

- [ ] `packages/chronic/` ships with `src/` checked in, started from the generator's output and finished by hand under trails CLAUDE.md (Ruby names and control flow, no invented surface). `codegen-declined.ts`, `codegen-runtime.ts` stubs and generator scaffolding are gone.
- [ ] `pnpm typecheck` is clean, tests included.
- [ ] Every `vendor/chronic/v0.10.2/test/test_*.rb` file (minitest) is ported as vitest next to its source under the Ruby test names, and the whole suite passes. Any `it.skip` carries a `PERMANENT-SKIP:` that cites a ratified trails CLAUDE.md section.
- [ ] parity reports 100% for `chronic` on API methods, files, arity, params, calls, call args and tests. The package is in `NAMING_ENROLLED_PACKAGES` and rowless in the extra-surface gate, and no baseline row is added.
- [ ] CI is green and the PR is merged.

## How to start

Generate the package on the spike branch `codegen-native-inference` (commit `f3bcba7e81` or later) in a scratch worktree:

```sh
CODEGEN_GEM=chronic pnpm tsx scripts/codegen/src/cli.ts --tests <every test_*.rb in vendor/chronic/v0.10.2/test>
SWAP_GENERATED_TESTS=1 CODEGEN_GEM=chronic scripts/codegen/swap-tree.sh
```

Copy `packages/chronic/codegen-out/src` into this story's branch from `main`, along with the package scaffolding from the spike (`package.json`, `tsconfig.json`). From then on the tree is hand-owned. Do not commit generator changes in this PR. If the generator has a bug, note it in the PR body.
