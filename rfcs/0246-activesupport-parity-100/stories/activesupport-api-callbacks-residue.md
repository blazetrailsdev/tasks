---
title: "activesupport: close the 15 missing callbacks.rb members"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` shows `callbacks.rb` at 71/86, with 15 missing methods. Get the
names from `pnpm parity:api -- --package activesupport --missing`.

## Acceptance criteria

- [ ] Port each missing member onto its Rails owner class or module in
      `packages/activesupport/lib/callbacks.ts`, or give it a receipt.
- [ ] `callbacks.rb` reaches 100% in `parity:api`, and `callbacks_test.rb`
      stays green.
