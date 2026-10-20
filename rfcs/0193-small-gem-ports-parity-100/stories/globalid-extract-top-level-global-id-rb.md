---
title: "Extract globalid's top-level lib/global_id.rb (deprecator, eager_load!)"
status: in-progress
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9132
claim: "2026-10-20T13:55:38Z"
assignee: "globalid-extract-top-level-global-id-rb"
blocked-by: null
closed-reason: null
---

## Context

The globalid Rails extraction reads only `vendor/globalid/v1.3.0/lib/global_id/`, so the top-level `lib/global_id.rb` is never extracted. That file reopens `class GlobalID` and defines:

- `self.eager_load!` (`lib/global_id.rb:15-18`)
- `self.deprecator` (`lib/global_id.rb:20-22`)

Neither appears in `rails-api.json` (`classes.GlobalID.classMethods` lists only the `global_id/global_id.rb` methods). As a result, trails' `GlobalID.deprecator` (`packages/globalid/src/global-id.ts`) is scored as a "moved" extra. This is why globalid's extra-surface mark carries `total: 1` (trails#9113). msgpack handles the same layout with a `"msgpack:../msgpack.rb"` key in `RUBY_FILE_TS_OVERRIDES` (`scripts/parity/conventions.ts`).

## Acceptance criteria

- `lib/global_id.rb` is extracted and maps to `global-id.ts`, for example with a `"globalid:../global_id.rb": "global-id.ts"` override, plus any extractor-root change it needs.
- `GlobalID.deprecator` is credited. Then tighten globalid's `total` to 0 and move the package to `ROWLESS_PACKAGES` if it qualifies.
- `eager_load!` shows up as missing, ported or skipped per the conventions.
