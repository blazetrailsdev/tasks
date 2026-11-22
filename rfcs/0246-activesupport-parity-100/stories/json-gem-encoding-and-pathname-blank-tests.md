---
title: "activesupport: port the json-gem encoding, pathname blank, signature? and logger-name residue"
status: claimed
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: test-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: "2026-11-22T03:09:35Z"
assignee: "flip-the-rails-ref-to-v8-0-5-1"
blocked-by: null
closed-reason: null
---

## Context

- json-gem-encoding ×2 and pathname blank (overlaps
  `json-encoding-test-ports-data-json-gem-and-io-arms`; merge if preferred).
- "log at only impact receiver": the TS test is renamed "…impacts…"
  (`packages/activesupport/test/logger.test.ts:189`); restore the Rails name.
- "#signature? handles non-ASCII-only non-binary-encoded strings"
  (`vendor/rails/v8.0.2/activesupport/test/message_pack/shared_serializer_tests.rb:44-47`).

## Acceptance criteria

- [ ] Each test runs as the Rails body and passes, or carries a `PERMANENT-SKIP:` citing a CLAUDE.md section.
- [ ] The logger test has its Rails name back.
