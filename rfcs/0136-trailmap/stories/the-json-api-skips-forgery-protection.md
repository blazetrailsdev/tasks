---
title: "The JSON API skips forgery protection, so mutation verbs work outside test"
status: ready
updated: 2026-10-28
rfc: "0136-trailmap"
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

`app/controllers/api-controller.ts` doesn't opt out of forgery protection, and the 8.0 defaults turn it on. So every mutation verb (`POST /stories/claim` and the rest) answers "Can't verify CSRF token authenticity" outside `test`, because the CLI posts JSON with no session and no token.

The suite never sees this: `config/environments/test.ts` sets `allowForgeryProtection = false`. Found 2026-10-26 by the Rails twin (`rails/`), whose `ApiController` declares `skip_forgery_protection`.

That is Rails' idiom for a JSON API inside a full app (`actionpack/lib/action_controller/metal/request_forgery_protection.rb:216`).

## Acceptance criteria

- [ ] `ApiController` declares `skipForgeryProtection()`.
- [ ] A test with forgery protection on posts a mutation verb with no token and gets the verb's answer, not a 422.
