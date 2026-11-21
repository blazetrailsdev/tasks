---
title: "parity: account for i18n's gettext backend files in the unported register"
status: draft
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files.test.ts` > "accounts for every file in the vendored i18n lib tree"
fails on main (seen while working trails#10512): `backend/gettext.rb` and `gettext/po_parser.rb`
in the vendored i18n gem are neither ported nor listed in `scripts/parity/unported-files/i18n.ts`.

## Acceptance criteria

- [ ] Both files are ported or carry an unported-files row in `i18n.ts` with a reason.
- [ ] The test passes.
