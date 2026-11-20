---
title: "form-helpers-await-form-authenticity-token"
status: done
updated: 2026-11-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10420
claim: "2026-11-20T16:29:20Z"
assignee: "form-helpers-await-form-authenticity-token"
blocked-by: null
closed-reason: null
---

## Context

Story `session-reads-async-in-templates` makes `Request::Session`'s readers async and lazy, as Rails' `load_for_read!` / `load!` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/session.rb:263-282`). The operator revoked the prewarm ruling on 2026-11-20. That makes `SessionStore#fetch` (`actionpack/lib/action-controller/metal/request-forgery-protection.ts:121-133`) and so `realCsrfToken` → `globalCsrfToken` / `perFormCsrfToken` → `maskedAuthenticityToken` → `formAuthenticityToken` async.

Its actionview consumers are synchronous today:

- `csrfMetaTags` (`actionview/lib/helpers/csrf-helper.ts:11-24`; Rails `csrf_helper.rb:22-30`)
- `tokenTag` (`actionview/lib/helpers/url-helper.ts:445-467`; Rails `url_helper.rb` `token_tag`)
- `extraTagsForForm` / `formTagHtml` / `formTagWithBody` (`actionview/lib/helpers/form-tag-helper.ts:554-610`)
- the blockless and sync-block arms of `formTag` (`form-tag-helper.ts:63-95`), `formWith` / `formFor` (`form-helper.ts:121,195-260`), and `buttonTo` (`url-helper.ts:~170`)

There are about 400 call sites across actionview, actiontext, turbo, trailties and their tests, which is too many for the session story's PR.

## Acceptance criteria

- `formAuthenticityToken?()` is typed `string | Promise<string>` on the actionview hosts and awaited in `tokenTag` and `csrfMetaTags`. Every helper above that reaches it is async on all arms, and the sync-result overloads and `@inventedArm if/then` content-is-Promise splits are removed where they existed only for a sync arm.
- Callers and tests await the helpers. No test name changes.
- Must land before `session-reads-async-in-templates`.
