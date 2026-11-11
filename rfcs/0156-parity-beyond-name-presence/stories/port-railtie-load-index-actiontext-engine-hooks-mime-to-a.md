---
title: "port-railtie-load-index-actiontext-engine-hooks-mime-to-a"
status: draft
updated: 2026-11-11
rfc: "0156-parity-beyond-name-presence"
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

Split from `port-non-accessor-rows-from-level-keyed-set`. Its named rows
(activemodel `naming.rb`, globalid `global_id.rb`, actionpack
`mime_type.rb` `symbols` / `valid_symbols?`, `explain_registry.rb`,
`scoping.rb` `ScopeRegistry`) no longer appear as missing on main
(measured 2026-11-11, `scripts/api-compare/output/api-comparison.json`). The
rows that remain missing in those files are:

- trailties `railtie.rb`: `Rails::Railtie.load_index` / `increment_load_index`
  (`vendor/rails/v8.0.2/railties/lib/rails/railtie.rb:194-209`, the
  `<=>` / `inherited` / protected `attr_reader :load_index` block), which
  `packages/trailties/lib/trailtie.ts:18-57` holds as a module `loadCounter`
  plus a `_loadIndex` own-state slot; and `Railtie#railtie_namespace`
  (`railtie.rb:266-268`), which trailtie.ts:139 spells `trailtieNamespace`
  while the static at :66 keeps `railtieName`. Decide one spelling under the
  `Railtie` → `Trailtie` token rule in `scripts/parity/conventions.ts:111,201`
  and apply it to both.
- actiontext `engine.rb`: `previewable_attachable?`,
  `attachable_plain_text_representation`,
  `to_trix_content_attachment_partial_path` on `ActionText::Engine`
  (`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb`, the
  `ActiveStorage::Blob` / `ActiveStorage::Attachment` hooks it defines in its
  initializers).
- actionpack `http/mime_type.rb`: `Mime::Type#to_a` / `#to_ary`. Check against
  CLAUDE.md's `to_ary` ruling (`Core#to_ary` is not ported) before porting;
  `to_ary` makes a Mime::Type read as a collection to `flatten`.

## Acceptance criteria

- Each row is ported on the seat Rails defines it on, at the vendored `file:line`
  above, or closed against a ruling it falls under.
- `parity:api` matched rises by the rows converged; nothing is baselined.
