---
title: "BenchmarkGenerator adds the benchmark-ips dependency like Rails' add_ips_to_gemfile"
status: ready
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - converge-generators-actions-gemfile-family-onto-package-json
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `BenchmarkGenerator#generate_layout` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/benchmark/benchmark_generator.rb:13-26`) runs `add_ips_to_gemfile unless ips_installed?`. `add_ips_to_gemfile` is `gem(IPS_GEM_NAME, group: [:development, :test])`, and `ips_installed?` matches `IPS_GEM_USED_REGEXP` against the Gemfile. Its template is a `Benchmark.ips` block with one `x.report` per report and `x.compare!`.

trails' `packages/trailties/src/generators/trails/benchmark/benchmark-generator.ts` has no `IPS_GEM_NAME` / `IPS_GEM_USED_REGEXP` constants, no `addIpsToGemfile` / `isIpsInstalled`, and no dependency step. Its template times the reports with `performance.now()` instead.

So `benchmark_generator_test.rb`'s Gemfile assertions and whole-file `assert_equal`, and `generate benchmark twice only adds ips gem once`, cannot be ported. Until they are, moving `generators/trails/benchmark/benchmark-generator.test.ts` to `generators/benchmark-generator.test.ts` raises the assertion-mismatch ratchet (+1 count, +2 kind; seen on trails#9798).

## Acceptance criteria

- `BenchmarkGenerator` ports `IPS_GEM_NAME`, `IPS_GEM_USED_REGEXP`, `addIpsToGemfile` (through the generator's `gem` action, which writes the `package.json` devDependency) and `isIpsInstalled`, in Rails' order.
- The test file moves to `generators/benchmark-generator.test.ts`, its bodies converged on the Rails test (all 4 tests), with the assertion ratchet green.
