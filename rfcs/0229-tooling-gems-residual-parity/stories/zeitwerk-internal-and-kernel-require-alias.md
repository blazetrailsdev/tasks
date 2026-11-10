---
title: "Port Zeitwerk::Internal#internal and Kernel#zeitwerk_original_require"
status: done
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "zeitwerk"
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: trails#9948
claim: "2026-11-10T13:44:28Z"
assignee: "rake-guarded-tests-and-thread-history-path"
blocked-by: null
closed-reason: null
---

## Context

`internal.rb` has no TS file: `Zeitwerk::Internal#internal(method_name)`
(`vendor/zeitwerk/v2.7.2/lib/zeitwerk/internal.rb:6-12`) makes the method private and publishes a
`__name` alias. `loader.rb`, `loader/callbacks.rb`, `loader/config.rb` and
`registry/explicit_namespaces.rb` each miss an `internal` row for it.
`core_ext/kernel.rb` is 0/2: `alias_method :zeitwerk_original_require, :require`
(`vendor/zeitwerk/v2.7.2/lib/zeitwerk/core_ext/kernel.rb:17-19`), read at :26 and :34.
Visibility is compile-time only (CLAUDE.md § "Method visibility is compile-time
only"), so the `private` half is the TS keyword and the `__name` alias is the
observable half. `zeitwerk-kernel-require-load-path-feature-arm` (0154) owns the
`:34-41` arm and is not re-filed.

## Acceptance criteria

- [ ] `packages/zeitwerk/lib/internal.ts` ports `internal`, installing the public
      `__name` alias; each Ruby `internal :name` call site calls it.
- [ ] `zeitwerk_original_require` is the alias over ruby-compat's `require`, and
      the patched `require` calls it at the gem's two sites.
- [ ] `pnpm parity:api` reports zeitwerk 147/147 once the registry story has
      also landed (the two stories close disjoint rows).
