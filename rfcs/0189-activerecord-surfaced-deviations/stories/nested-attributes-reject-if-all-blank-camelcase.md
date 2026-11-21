---
title: 'rejectIf: "all_blank" is camelCase "allBlank" (casing ruling)'
status: draft
updated: 2026-11-21
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`acceptsNestedAttributesFor` resolves `rejectIf: "all_blank"`
(`packages/activerecord/lib/nested-attributes.ts:60`) to `REJECT_ALL_BLANK_PROC`,
mirroring Rails' `reject_if: :all_blank`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb`, the
`REJECT_ALL_BLANK_PROC` resolution in `accepts_nested_attributes_for`). CLAUDE.md
§ "Fidelity is the job", "Casing is translated, never mirrored" (operator ruling
2026-11-18): a Ruby Symbol value spelled snake_case is camelCase in trails, so the
value should be `"allBlank"`. The Form Helpers guide
(`packages/website/docs/guides/form-helpers.md`, "Preventing Empty Records")
documents the current `"all_blank"`.

## Acceptance criteria

- [ ] `rejectIf: "allBlank"` resolves to `REJECT_ALL_BLANK_PROC`; the `"all_blank"` arm is removed.
- [ ] Every caller (canonical models such as `Pirate`, tests) uses `"allBlank"`.
- [ ] The Form Helpers guide says `rejectIf: "allBlank"`.
