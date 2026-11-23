---
title: "bump-the-read-anchors-minitest-6-and-rails-dom-testing-2-3"
status: done
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps:
  - flip-the-rails-ref-to-v8-0-5-1
deps-rfc: []
est-loc: null
priority: null
pr: trails#10611
claim: "2026-11-22T22:54:09Z"
assignee: "bump-mini-magick-to-5-3-1"
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1; owner ruling 2026-11-22: stop at the Rails `v8.0.5.2` lock.
Read-anchors moved by `vendor/rails/v8.0.5.2/Gemfile.lock`: minitest
v5.27.0 → v6.0.0 (commit `2f3d88eeed8a55ed504e362c42e150eaa623ecd5`) and
rails-dom-testing v2.2.0 → v2.3.0 (commit
`f8cb4b3964a4d8397ce29b0306cbaedea93150ca`). Dry runs:
`scripts/parity/bump-ledger/reports/minitest-v5.27.0-v6.0.0.2026-11-22.json`
(0 ledger rows) and `rails-dom-testing-v2.2.0-v2.3.0.2026-11-22.json`
(tests 55→69, +14; 0 ledger rows). Fits one PR; no ledger.

## Acceptance criteria

- [ ] Retake both pin floors before the flip.
- [ ] Both pinned at the tags above; the 14 new rails-dom-testing tests ported or filed.
- [ ] `pnpm parity:changed` green.
