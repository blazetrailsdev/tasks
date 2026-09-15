---
title: "Gate Ruby catch calls against kernelCatch in the call-parity ratchet"
status: draft
updated: 2026-09-15
rfc: "0148-ruby-compat-catch-throw"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/compare.ts:269` lists Ruby `catch` in the call gate's no-JS-call-form set. The comment below it (`:272-277`) says the only faithful port of `catch(:tag)` is a `try` whose `catch` clause re-raises. That stopped being true when `kernelCatch` / `kernelThrow` landed (`ruby-compat/src/kernel-catch.ts`, trails#7758), and every `:abort` / `:exception` site now calls them (trails#7766). With `catch` in the set, the call gate never checks for a Ruby `catch(...)` call, so a TS body can drop `kernelCatch` and still pass. Ruby sites: `activesupport/lib/active_support/callbacks.rb:667`, `activerecord/lib/active_record/associations/collection_association.rb:400,462`, `activemodel/lib/active_model/error.rb:85`, `i18n/lib/i18n.rb:394`, `i18n/lib/i18n/backend/chain.rb:61,84`.

## Acceptance criteria

- [ ] `"catch"` removed from that set; the `catch` → `kernelCatch` spelling made to match through the call-name conventions, the same way `throw` → `kernelThrow` does.
- [ ] The stale comment at `compare.ts:272-277` deleted.
- [ ] Every new `parity:api:calls` row this surfaces is converged by calling `kernelCatch` at the Rails site, not baselined.
