---
title: "session-reads-async-in-templates"
status: draft
updated: 2026-10-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`cache-store-async-consumers` made templates async (`actionview/src/template.ts`), which removes the wall that kept session accessors synchronous: `formAuthenticityToken` (`actionpack/src/action-controller/metal/request-forgery-protection.ts`) and `request.flash` (`actionpack/src/action-dispatch/middleware/flash.ts`) are read from inside templates, so the session `CacheStore` is still prewarmed in `prepareSession` rather than read on demand. Rails reads the session lazily on first access (`actionpack/lib/action_dispatch/request/session.rb:263-273`, `load_for_read!` / `load!`).

**Owner decision needed first.** `packages/actionpack/CLAUDE.md` § "A
cache-backed session is prewarmed and peeked" ratifies the prewarm (repo owner,
2026-10-16, trails#8997) and `Request::Session#prewarmBang` carries
`@noRailsEquivalent PERMANENT` / `@inventedArm prewarmBang — PERMANENT`
(`actionpack/src/action-dispatch/request/session.ts:170,347`). The ruling's
stated reason is that a non-streaming template compiles to a synchronous
function; this story's premise is that templates are now async. If that reason
no longer holds, the section has to be revisited by the repo owner before
this story can converge; otherwise close it `PERMANENT:` against that section.

## Acceptance criteria

- Session reads that reach an async store are awaited at their call sites, including from templates, and `prepareSession`'s prewarm is removed.
- The tests that exercise `formAuthenticityToken` and `flash` from a view stay green.
