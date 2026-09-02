---
title: "parity-api-cannot-follow-a-port-across-packages"
status: closed
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "moot under the rewritten fold shape (tasks#31): keeping Rails::Railtie at packages/trailties/src/trailtie.ts removes the cross-package mapping this story existed to add"
---

## Context

`parity:api` resolves a Ruby file's TS counterpart inside ONE package src dir:
`compare.ts:3590` is `rubyFileToTs(rubyFile, pkg)` and `:3534` pins
`pkgSrcDir = packageSrcDir(pkg)`, while `tsMethodsByFile` / `tsFilesByMethod`
(`compare.ts:3543-3552`) are built from that package's TS manifest alone.
`RUBY_FILE_TS_OVERRIDES` (`scripts/parity/conventions.ts:124`) can only rename a
file WITHIN the package, and `packageSrcDir` (`scripts/api-compare/config.ts:158`)
gives each manifest package exactly one root.

So a port that legitimately lives in a different package than its gem is
invisible: the Ruby file scores 0% and its methods leave the numerator.

The fold in `fold-the-two-trailtie-ports-into-one` (PR #NNNN) is the first real
instance. `Rails::Railtie` is in the railties gem, but every framework package
registers a railtie and none of them can depend on trailties (trailties depends
on activerecord), so the single `Trailtie` has to live in activesupport. Four
railties Ruby files now report 0% against trailties even though the port is
complete and its tests pass:

- `railtie.rb` -> `packages/activesupport/src/trailtie.ts` (25 methods)
- `initializable.rb` -> `packages/activesupport/src/initializable.ts` (16)
- `railtie/configuration.rb` -> `packages/activesupport/src/trailtie/configuration.ts` (14)
- `railtie/configurable.rb` -> `packages/activesupport/src/trailtie/configurable.ts` (3)

Their members land in activesupport's `parity:api:extra` "moved" column instead
(`trailtie.ts` 20 moved, `initializable.ts` 19 moved, `trailtie/configuration.ts`
16 moved), which is the tool correctly saying "Rails defines these, just not in
a .rb this package owns".

## Converged shape

A declared cross-package redirect — the sibling of `RUBY_FILE_TS_OVERRIDES`,
keyed the same `<package>:<ruby path>` way but naming the package that holds the
port. Where it applies, the comparison for that Ruby file resolves
`tsMethodsByFile` / `tsFilesByMethod` / `tsFileExists` / arity / params / calls
against the target package's manifest and src dir instead of `pkg`'s.

Only-grow by review, like every other register here: a redirect is a claim that
a genuine dependency-direction constraint forces the port out of its gem's
package, not a way to quiet a missing file.

## Acceptance criteria

- [ ] The four railties files above score against their activesupport ports, so
      trailties' `parity:api` method and file counts return to (at least) their
      pre-fold values.
- [ ] The redirect table is documented next to `RUBY_FILE_TS_OVERRIDES` and
      covered by a `scripts/` test.
- [ ] `parity:api:calls` / `:args` / `:params` resolve the redirected files too —
      a redirected file must not silently drop out of the call gates' population.
- [ ] No other package's totals move.
