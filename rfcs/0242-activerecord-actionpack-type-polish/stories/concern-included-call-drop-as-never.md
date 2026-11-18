---
title: "Drop as never from Concern.included.call sites"
status: draft
updated: 2026-11-18
rfc: "0242-activerecord-actionpack-type-polish"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10301 widened `Concern.included` / `prepended` to `this: object` (`packages/activesupport/lib/concern.ts`). The `Concern.included.call(Mod as never, null, fn)` sites in actionmailer (`form-builder.ts:22`, `callbacks.ts:40`, `test-case.ts:51,163`, `delivery-methods.ts:88`, `preview.ts:69`, `queued-delivery.ts:8`) and actionmailbox (`routing.ts:26`, `inbound-email/routable.ts:23`, `inbound-email/incineratable.ts:20`) therefore no longer need the `as never` cast. Rails: `active_support/concern.rb` `included(base = nil, &block)`.

## Acceptance criteria

- [ ] Drop `as never` from every `Concern.included.call` / `Concern.prepended.call` site in the repo.
- [ ] `pnpm build` passes.
