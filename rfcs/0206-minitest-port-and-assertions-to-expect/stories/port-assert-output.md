---
title: "Port Minitest assert_output; drop image-processing assert_output receipts"
status: draft
updated: 2026-11-08
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Minitest's `assert_output(stdout = nil, stderr = nil) { }` (minitest/assertions.rb, `assert_output`) has no trails port. `packages/image-processing/test/mini-magick.test.ts` "accepts deprecated :compose" / "accepts deprecated :geometry" (`vendor/image_processing/v1.14.0/test/mini_magick_test.rb:497-502, 514-519`) spy on `stderr.write` and `toMatch`, scored through two receipts in `scripts/test-compare/assertion-receipts/image-processing.ts` (`assert_output` value `x:nil` re-scored as `assert_match`).

## Acceptance criteria

- [ ] `assertOutput(stdout, stderr, block)` ported at its Minitest name/location (RFC 0206 home), capturing ruby-compat `stdout`/`stderr`, matching String/Regexp like Minitest.
- [ ] The two mini-magick tests call `assertOutput(null, /renamed/, ...)` / `(null, /deprecated/, ...)` and the two receipts are deleted.
- [ ] `parity:test:assertions` OK.
