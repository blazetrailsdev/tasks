---
title: "trailties-encrypted-edit-interrupt-test-races-save"
status: draft
updated: 2026-11-21
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

# trailties: encrypted edit interrupt test races the save

## Context

`packages/trailties/test/commands/encrypted.test.ts` "edit command does not display save confirmation message if interrupted" failed on CI (trails#10494, run 44912584003, job 136871520862, Trailties Tests shard 2/3) with `expected 'File encrypted and saved.\n' not to match /file encrypted and saved/i` after 2416ms. It passes locally (16/16), and the PR touched no trailties or encrypted-file code, so the interrupt arrives after the save completes on a slow runner. Rails' test: `vendor/rails/v8.0.2/railties/test/commands/encrypted_test.rb` (the interrupted-edit case raises `Interrupt` from the editor, so the save never runs).

## Acceptance criteria

- [ ] The interrupt is delivered deterministically before the save (as Rails raises `Interrupt` from the editor command), not by timing.
- [ ] The test passes under CI load with no retry.
