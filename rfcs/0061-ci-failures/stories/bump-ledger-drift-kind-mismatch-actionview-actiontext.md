---
title: "bump-ledger-drift-kind-mismatch-actionview-actiontext"
status: draft
updated: 2026-11-24
rfc: "0061-ci-failures"
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

The Bump-ledger gate (`pnpm exec tsx scripts/api-compare/lint-bump-ledger.ts`, `.github/workflows/ci.yml:2376`) fails on current `origin/main` (65161fd9aa), and so reds every PR run. Seen on trails#10715 (run 45481237318), which touches none of these files. Reproduced locally on `origin/main` merged in, after a forced build and `pnpm parity:api`:

```text
bump-ledger gate: problem row(s) in scripts/parity/bump-ledger/:
  kind  actiontext  tag_helper.rb:render — kind "drift" does not match the pair
  kind  actionview  helpers/sanitize_helper.rb:strip_tags — kind "drift" does not match the pair
  kind  actionview  helpers/text_helper.rb:excerpt — kind "drift" does not match the pair
  kind  actionview  helpers/text_helper.rb:highlight — kind "drift" does not match the pair
  kind  actionview  helpers/text_helper.rb:strip_tags — kind "drift" does not match the pair
```

(The three `text_helper.rb` rows reproduce on the merge; the other two showed up only on the branch alone.) Likely sources: trails#10711 (actionview `strip_tags` / `highlight`) and trails#10704 (actiontext burn-down). They changed the pairs without updating or retiring their ledger rows.

## Acceptance criteria

- [ ] Each row above is re-verified against the v8.0.5.2 body. It is re-pinned with `pnpm tsx scripts/api-compare/body-pins.ts --pin <ruby-file>`, which deletes the row, or its `kind` is corrected.
- [ ] `lint-bump-ledger.ts` exits 0 on `main`.
