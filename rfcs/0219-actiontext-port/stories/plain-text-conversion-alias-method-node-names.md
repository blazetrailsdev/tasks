---
title: "Port plain_text_conversion.rb's alias_method h1/p/ul/ol node names"
status: claimed
updated: 2026-11-17
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-17T18:51:48Z"
assignee: "actiontext-engine-and-attachable-methods-credited"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actiontext/lib/action_text/plain_text_conversion.rb:38-47` defines `plain_text_for_h1_node` / `plain_text_for_p_node` (`alias_method` of `plain_text_for_block`) and `plain_text_for_ul_node` / `plain_text_for_ol_node` (of `plain_text_for_list`) in `%i[...].each` loops. `pnpm parity:api --package actiontext` reports all four missing from `packages/actiontext/lib/plain-text-conversion.ts`.

## Acceptance criteria

- `plainTextForH1Node`, `plainTextForPNode`, `plainTextForUlNode`, `plainTextForOlNode` exist as aliases of `plainTextForBlock` / `plainTextForList`, and node dispatch reaches them by those names.
- parity:api reports `plain_text_conversion.rb` at 22/22.
