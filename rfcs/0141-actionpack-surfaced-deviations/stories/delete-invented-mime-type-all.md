---
title: "delete-invented-mime-type-all"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
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

## Context

`MimeType.all()` (`packages/actionpack/src/action-dispatch/http/mime-type.ts`)
has no counterpart in `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb`.
Rails' collection of registered types is `Mime::SET` (`mime_type.rb:46`,
`Mimes` at `:8-44`, which `include Enumerable`), and `all()` now just returns
`MimeType.SET.select(() => true)`. Its only callers are two trails-invented
tests in `action-dispatch/dispatch/mime-type.test.ts` ("all() returns unique
registered types in registration order", "all() picks up a newly registered
type and drops it on unregister"), which carry no Rails test name.

Surfaced in review of trails#8256 (the LOOKUP / EXTENSION_LOOKUP split), where
removing it was out of scope.

## Acceptance criteria

- [ ] `MimeType.all()` is deleted; any reader iterates `MimeType.SET` (`Mime::SET`).
- [ ] The two trails-only `all()` tests are deleted.
- [ ] `pnpm parity:api:extra --package actionpack` shows one fewer extra.
