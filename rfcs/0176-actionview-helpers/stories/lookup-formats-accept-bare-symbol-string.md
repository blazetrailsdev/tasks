---
title: "Lookup resolves formats given as a bare string"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9205
claim: "2026-10-22T00:48:07Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

## Context

The actionpack TSE fixtures `test/html_template.html.tse` and `test/change_priority.html.tse` (`packages/actionview/src/test-helpers/fixtures/actionpack/`) render with `formats: "json"`. They mirror Rails' `formats: :json` (`vendor/rails/v8.0.2/actionpack/test/fixtures/test/html_template.html.erb`). Under CLAUDE.md's Symbol rule, `:json` ports as the bare string `"json"`. trails' lookup resolves only `":json"`, so both fixtures raise `Missing partial test/_first_json_partial` / `test/_json_change_priority`. The trails-tsc stand-in harness (`tse-stand-in.test.ts`) records those raises as each scenario's output.

The suspected normalization site is `DetailsKey.detailsCacheKey` (`packages/actionview/src/lookup-context.ts:62-67`), which filters formats against `Template.Types.symbols()`. Rails' `LookupContext#formats=` and `DetailsKey.details_cache_key` (`actionview/lib/action_view/lookup_context.rb`) treat formats as symbols.

## Acceptance criteria

- `render({ partial, formats: "json" })` resolves `_partial.json.tse`, as `formats: :json` does in Rails.
- The `actionpack/test/html_template` and `actionpack/test/change_priority` stand-in scenarios render their JSON partials instead of raising.
