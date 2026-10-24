---
title: "Port raabro as @blazetrails/raabro from generated output to 100%"
status: draft
updated: 2026-10-24
rfc: "0207-fugit-gem-family-port"
cluster: fugit-family
packages: ["raabro"]
deps: ["vendor-fugit-gem-family-sources"]
deps-rfc: []
est-loc: 5000
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

raabro (`vendor/raabro/v1.4.0/lib/raabro.rb`) is the parser-combinator module fugit's parsers `include`. Generated at `f3bcba7e81`, it is 4 files with 2,883 non-blank lines, and its 15 specs come to 1,782 lines. 292 tsc errors (136 in tests), 10 of 89 specs passing. The most common failures are `isOdd` missing from ruby-compat, `Cannot convert object to primitive value`, and `rbObjDup(...).push` on a non-Array. fugit's parse path through raabro already works at runtime on the spike (fugit's cron and duration specs pass through it), so the remaining work is mostly in raabro's own tree / failure-reporting API.

## Acceptance criteria

- [ ] `packages/raabro/` ships with `src/` checked in, started from the generator's output and finished by hand under trails CLAUDE.md (Ruby names and control flow, no invented surface). `codegen-declined.ts`, `codegen-runtime.ts` stubs and generator scaffolding are gone.
- [ ] `pnpm typecheck` is clean, tests included.
- [ ] Every `vendor/raabro/v1.4.0/spec/*_spec.rb` file is ported as vitest next to its source under the Ruby test names, and the whole suite passes. Any `it.skip` carries a `PERMANENT-SKIP:` that cites a ratified trails CLAUDE.md section.
- [ ] parity reports 100% for `raabro` on API methods, files, arity, params, calls, call args and tests. The package is in `NAMING_ENROLLED_PACKAGES` and rowless in the extra-surface gate, and no baseline row is added.
- [ ] CI is green and the PR is merged.

## How to start

Generate the package on the spike branch `codegen-native-inference` (commit `f3bcba7e81` or later) in a scratch worktree:

```sh
CODEGEN_GEM=raabro pnpm tsx scripts/codegen/src/cli.ts --tests all_spec.rb,alt_spec.rb,eseq_spec.rb,failure_spec.rb,jseq_spec.rb,nott_spec.rb,ren_spec.rb,rep_spec.rb,rex_spec.rb,sample_spec.rb,sample_xell_spec.rb,sample_xel_spec.rb,seq_spec.rb,str_spec.rb,tree_spec.rb
SWAP_GENERATED_TESTS=1 CODEGEN_GEM=raabro scripts/codegen/swap-tree.sh
```

Copy `packages/raabro/codegen-out/src` into this story's branch from `main`, along with the package scaffolding from the spike (`package.json`, `tsconfig.json`). From then on the tree is hand-owned. Do not commit generator changes in this PR. If the generator has a bug, note it in the PR body.
