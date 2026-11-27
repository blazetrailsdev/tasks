---
title: "The loopback API refuses a write carrying Origin, so an html audit's script cannot post to a verb"
status: in-progress
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#205
claim: "2026-11-26T23:14:37Z"
assignee: "bump-the-ringo-pin-for-rfc-session-endpoints"
blocked-by: null
closed-reason: null
---

## Context

trailmap#185 (merged) serves and frames audits with `sandbox allow-scripts`, so an
agent-written `.html` audit's scripts now run, in an opaque origin. The review of
trailmap#185 found the hole it opens, and the fix was finished after the merge:

- `app/controllers/api-controller.ts:28` and `rails/app/controllers/api_controller.rb:9`
  `skipForgeryProtection`, and the verbs parse form-encoded bodies.
- `app/controllers/concerns/loopback-only.ts` `isLoopbackRequest` admits any request with
  a raw loopback `Host` and no forwarded headers.

So anyone viewing `/audits` on loopback (dev, screenshot sessions) runs a script that
can send a no-cors form POST to `/stories/claim` and the other verbs. It cannot read the
answer, but the write lands. Verified: without the guard below, a form POST with
`Origin: null` to `claim` answers 200 and claims the story.

The fix is on branch `loopback-api-refuses-browser-writes` (commit e630b88), not yet a PR.
Browsers send `Origin` on every POST (`null` from a sandbox). Node's fetch (checked on
v20: sends `sec-fetch-mode` but no `Origin`) and Go's `net/http` send none. So
`isLoopbackRequest` refuses an unsafe method that carries `Origin`, with the existing 404.
The branch also carries the trailmap#185 review nits: inline the audit CSP string, skip `f` in a
`<select>` or any editable element, and pin that Escape in a field leaves fullscreen.

## Acceptance criteria

- A POST/PUT/PATCH/DELETE to the loopback API that carries an `Origin` header (including
  `null`) is refused with 404 in both apps; GETs and Origin-less writes are unchanged.
- `test/controllers/mutations-controller.test.ts` posts a form `claim` with `Origin: null`
  and asserts 404 and no claim; `rails/test/controllers/endpoints_test.rb` does the same
  and also asserts a JSON claim without `Origin` still lands.
- The comments in `audits-controller.ts` and `audits_controller.rb` name the API rule,
  not only forgery protection.
- The tasks CLI and ringo still drive every verb on the box after deploy.
