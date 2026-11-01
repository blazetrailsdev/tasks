---
title: "activestorage-transformer-deviations-ruling"
status: done
updated: 2026-11-01
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9560
claim: "2026-11-01T01:54:44Z"
assignee: "testtask-direct-loader-libs-reach-load-path"
blocked-by: null
closed-reason: null
---

## Context

`packages/activestorage/src/transformers/image-processing-transformer.ts` carries two unratified additions to Rails.
`process` awaits `ImageProcessing.loadPath[...]` where Ruby's `autoload :MiniMagick` / `:Vips`
(`vendor/image_processing/v1.14.0/lib/image_processing.rb:10-11`) loads inside `const_get`
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/transformers/image_processing_transformer.rb:29`).
`validate_transformation` also accepts the camelCase spelling of a listed method, where Rails compares exactly (`:54`).

`operations` also refuses `combineOptions` beside `combine_options` (Rails `name.to_s == "combine_options"`, `:38`) and pushes `camelize(name...)` where Rails pushes `[ name, argument ]` (`:45`).

## Acceptance criteria

- The repo owner rules on the awaited load, the camelCase allowlist spelling, the `combineOptions` arm and the name normalisation in `operations`, recorded in CLAUDE.md.
- The `@inventedArm` receipts are converged, or become `PERMANENT` under that ruling.
