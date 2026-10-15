---
title: "actionview: drop the 12 stale helper/layouts entries from the unported-files register"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/actionview.ts` still hides 12 helper-side files behind reasons that are no longer true ("trails ports no view layer", "nothing under it is ported"): `/helpers.rb`, `helpers/asset_tag_helper.rb`, `helpers/translation_helper.rb`, `helpers/form_options_helper.rb`, and `helpers/tags/{select,collection_select,grouped_collection_select,collection_check_boxes,collection_radio_buttons,time_zone_select,weekday_select}.rb`, plus `/layouts.rb` (ported as `layouts.ts`; RFC 0140 wants it gone too).

Measured at the 2026-10-15 refine (origin/main `493717f2c5`, fresh build, entries removed locally): actionview goes to 1173/1339 own-row with every helper row visible. Newly counted: `helpers.rb` 214/301, `asset_tag_helper.rb` 100%, `layouts.rb` 37/40, `form_options_helper.rb` 0/21, `translation_helper.rb` 0/12, and the seven select/collection Tags at 0 (26-33 each, most of it the FormOptionsHelper include).

## Acceptance criteria

- [ ] Those 12 entries and `FORM_HELPER_REASON` are removed; only `template/handlers/builder.rb` and `/test_case.rb` remain.
- [ ] Any parity gate/ratchet baseline that counts actionview is updated to the new (lower) figure in the same PR.
- [ ] The RFC 0176 README's measured table is refreshed from `pnpm parity:api --package actionview --files`.
