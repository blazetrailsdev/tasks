---
title: "GeneratorGenerator: directory + hook_for :test_framework"
status: ready
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
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

`Rails::Generators::GeneratorGenerator` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/generator/generator_generator.rb:11-15`) is `directory ".", generator_dir` followed by `hook_for :test_framework`. The test_unit hook writes `test/lib/generators/<path>_generator_test.rb`.

trails' `packages/trailties/src/generators/trails/generator/generator-generator.ts` `createGeneratorFiles` writes USAGE, `templates/.keep` and the generator by hand with `createFile`. It has no `directory` call and no `hookFor("testFramework")`, so no test file is generated.

`generator_generator_test.rb:10-68` asserts that test file in all four tests (`/class AwesomeGeneratorTest < Rails::Generators::TestCase/`, `/require "generators\/awesome\/awesome_generator"/`). So moving `generators/trails/generator/generator-generator.test.ts` to `generators/generator-generator.test.ts` (story trailties-move-tests-remaining) reds the assertion ratchet with 4 count mismatches. trails#9758 tried the move and reverted it.

## Acceptance criteria

- `GeneratorGenerator` is `directory(".", generatorDir())` plus `hookFor("testFramework")`, with templates under `trails/generator/templates/`, and a test_unit generator writes the generator test file.
- `generator-generator.test.ts` moves to `generators/` and asserts the test file the way Rails does. The assertion ratchet stays green.
