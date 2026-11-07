---
title: "actions-gem-and-benchmark-ips-dependency"
status: draft
updated: 2026-11-07
rfc: "0212-trailties-port"
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
closed-reason: null
---

## Context

`Rails::Generators::Actions#gem` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb:22-60`) is not ported in `packages/trailties/src/generators/actions.ts`. So `BenchmarkGenerator#generate_layout`'s `add_ips_to_gemfile unless ips_installed?` (`railties/lib/rails/generators/rails/benchmark/benchmark_generator.rb:13-26`) has no trails counterpart. The two benchmark assertions it backs are also unported: `benchmark_generator_test.rb:18` (the Gemfile has `gem "benchmark-ips"`) and `:75-83` ("generate benchmark twice only adds ips gem once").

## Acceptance criteria

- `gem` is ported as the package.json analogue (a dependency entry, `group:` mapping to devDependencies).
- `BenchmarkGenerator` carries `IPS_GEM_NAME` / `IPS_GEM_USED_REGEXP`, `addIpsToGemfile` and `isIpsInstalled`, and calls them as Rails does.
- Both benchmark assertions are ported with their test names verbatim.
