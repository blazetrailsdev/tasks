---
title: "ruby-compat: Dir.chdir raises for sibling async blocks inside one open block"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
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

trails#8541 ported `chdir_thread` (`vendor/ruby/v3.3.11/dir.c:1045,1058-1059,1071-1072,1083-1084`) into
`Dir.chdir` (`packages/ruby-compat/src/dir.ts`). Every open block runs under ONE owner, minted when
the first block opens and carried by the async context, so a call from outside that context raises
`RuntimeError` "conflicting chdir during another chdir block".

Two cases still pass where Ruby's one-thread-one-call model could not produce them:

- Two sibling blocks started inside one open block (`Promise.all` of two `Dir.chdir(..., async …)`
  inside an outer block) share the outer block's owner. They interleave and restore out of LIFO
  order, the bug the story `ruby-compat-dir-chdir-concurrent-async-blocks` closed for top-level
  siblings. ruby-compat's `synchronize` (`packages/ruby-compat/src/monitor.ts`) already tells these
  apart by giving each entry an owner of its own under its holder.
- On the fallback async-context adapter (no `AsyncLocalStorage` / `AsyncContext`,
  `packages/ruby-compat/src/async-context-adapter.ts`) a sibling reads the open block's store, so
  the check never fires.

## Acceptance criteria

- [ ] A `Dir.chdir` block opened while a sibling block under the same outer block is still pending
      raises the `dir.c:1083-1084` `RuntimeError`; a block nested inside the innermost open block
      still runs, and restore stays LIFO (`chdir_restore`, `dir.c:1066-1076`).
- [ ] The fallback adapter either raises for an overlapping sibling or the limitation is recorded
      where the adapter documents its other overlapping-scope limit.
- [ ] `dir.trails.test.ts` covers two sibling blocks inside one outer block.
