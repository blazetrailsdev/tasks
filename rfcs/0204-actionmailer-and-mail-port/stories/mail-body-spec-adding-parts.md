---
title: "mail-body-spec-adding-parts"
status: done
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9718
claim: "2026-11-04T17:06:36Z"
assignee: "mail-body-spec-adding-parts"
blocked-by: null
closed-reason: null
---

## Context

The `mail-body-part-attachments-specs-remainder` PR ported body_spec.rb,
parts_list_spec.rb, part_spec.rb and attachments_list_spec.rb, except
body_spec.rb's `describe "adding parts"` block
(`vendor/mail/2.8.1/spec/mail/body_spec.rb:247-386`, 10 tests), which was
held back to keep that PR under the LOC ceiling. A port of the block was
written and all 10 tests passed against `packages/mail/src/body.ts`
(`push`, `setSortOrder`, `sortPartsBang`, `encoded`) and `Message#addPart`.

## Acceptance criteria

- The 10 `adding parts` tests are in `packages/mail/src/body.test.ts` under
  `describe("adding parts")`, with the Rails names verbatim, and pass.
