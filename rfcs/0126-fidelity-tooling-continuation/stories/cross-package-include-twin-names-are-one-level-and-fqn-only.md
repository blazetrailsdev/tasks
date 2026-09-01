---
title: "Cross-package twin-name lookup is one level deep and fully-qualified only"
status: draft
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shipped deliberately narrow in PR #7352 (RFC 0126), and worth widening once the
population is measured.

`crossPackageIncludedMethodNames` (`scripts/api-compare/compare.ts`) supplies
the twin names `predicatePairedWithBareTwin` needs: `docs/ruby-ts-conventions.md`
drops a predicate's trailing `?`, so `foo?` and `foo` produce the same TS
spelling, and the param-name check must know when the bare camel name is
already some OTHER Ruby method's. `flattenIncludedMethodInfos` resolves an
`include` against `rubyPkg` alone — correctly, since a cross-gem mixin is the
other gem's to port — so a host's cross-gem includes contribute no names, and
this helper collects them separately.

It answers only the narrowest form of the question:

1. **Fully-qualified include sites only.** It skips any `inc` without `::`.
   `ActionController::Parameters`' `include ActiveSupport::DeepMergeable`
   (`actionpack/lib/action_controller/metal/strong_parameters.rb:161`) is
   qualified and resolves; a host that writes the bare short name after a
   namespace-scoped resolution does not.
2. **One level.** It reads the module's own `instanceMethods` /
   `classMethods` and does not walk that module's own `includes`, the way
   `flattenIncludedMethodInfos` does (`compare.ts`, the `walk` closure). Ruby's
   `include` chains do propagate, so a mixin that includes another mixin
   contributes those names to the host too.

Both are conservative in the safe direction — a missed twin name means a
predicate row is still reported, never that a real rename is hidden — but the
misses are real and unmeasured.

## Converged shape

Resolve the include name the way `resolveModuleName` already does for the
in-package walk (namespace-scoped, against `moduleFqnByShort`) before falling
back to a cross-package FQN lookup, and follow the module's own `includes`
transitively with a `visited` guard, mirroring `flattenIncludedMethodInfos`'s
`walk`. Names only, still: this pool must never move a matched/missing figure,
which is the invariant the current docstring states and any widening has to
preserve.

## Acceptance criteria

- [ ] Report how many additional twin names the widened resolution finds, and
      which predicate rows (if any) it retires from
      `output/param-name-mismatches.json`.
- [ ] `pnpm parity:api` methods, files, inheritance and arity figures unmoved —
      the pool is names-only by construction and must stay so.
- [ ] `pnpm parity:api:params` still OK; any mark it frees is narrowed with
      `pnpm parity:api:params:tighten`, never rewritten upward.
- [ ] Unit coverage in `scripts/api-compare/compare.test.ts` for the
      namespace-scoped short name and the transitive `include` chain.
