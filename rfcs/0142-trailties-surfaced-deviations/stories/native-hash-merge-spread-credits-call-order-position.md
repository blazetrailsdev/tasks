---
title: "Call-order check credits a native spread as Ruby merge's position"
status: draft
updated: 2026-10-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base#initialize` (`vendor/thor/v1.3.2/lib/thor/base.rb:53-113`) calls `parse_options.merge(command_options)` before `stop_on_unknown_option?`. On a plain object that call is ported as `{ ...parseOptions, ...commandOptions }`, per CLAUDE.md's native Hash table. The call-order check in `scripts/api-compare/compare.ts` (`reorderedCalls`) then pairs Ruby's first `merge` with the later `config.classOptions.merge(...)`, and reports `order:isStopOnUnknownOption,merge` on `thor/group.ts` and `thor/thor.ts`. Both are baselined (`call-mismatches-exclude/thor/{group,thor}.json`) since trails#9075.

## Acceptance criteria

- `reorderedCalls` credits a native object spread as the position of a Ruby `merge` (the order arm of the native-form crediting), so neither row flags.
- Both baseline rows are deleted.
