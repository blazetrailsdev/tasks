---
title: "i18n residual: SubtreeProxy#inspect, MissingTranslation#options, six call-argument rows"
status: ready
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: [i18n]
deps: [burn-down-and-enroll-i18n]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `backend/key_value.rb` is 41/42: `I18n::Backend::KeyValue::SubtreeProxy#inspect` (`vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:196`) is missing. `exceptions.rb` is 18/19: `I18n::MissingTranslation#options` is missing. See `missing-translation-base-permitted-keys-and-to-s-alias` (0188).
- Argument rows: `backend/base.rb load_file` `tr(".", "")` gets an extra leading `type`; `load_json` `parse(read)` vs `readFile` and `backend/flatten.rb resolve_link` `gsub` vs `replaceAll` (both currently carry receipts, which this story removes by converging the argument); `i18n.rb translate` `translate_key(..., throw, ...)` vs `throwOption` (twice; `throw` is a JS reserved word as a binding name, so rename to whatever `docs/ruby-ts-conventions.md` produces for a reserved-word identifier; if it produces none, file a conventions story under this RFC instead of receipting the row); `interpolate/ruby.rb interpolate_hash` calls `missing_interpolation_argument_handler` with three args, where Rails passes none at that site. Shards: `i18n/backend/base.json`, `i18n/interpolate/ruby.json`.
- Extra surface (12 moved) is owned by `burn-down-and-enroll-i18n` (0120), a deps edge.

## Acceptance criteria

- [ ] i18n 289/289 methods.
- [ ] Both i18n shards are deleted and tightened, and 0 i18n rows remain in `call-arg-mismatches.json`; the `loadJson` / `resolveLink` receipts are deleted, not kept.
- [ ] `parity:api:extra --package i18n` reports 0 novel / 0 moved (delivered by the deps story).
