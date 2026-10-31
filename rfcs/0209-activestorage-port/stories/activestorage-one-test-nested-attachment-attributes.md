---
title: "activestorage-one-test-nested-attachment-attributes"
status: in-progress
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9543
claim: "2026-10-31T17:48:46Z"
assignee: "activestorage-one-test-nested-attachment-attributes"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/models/attached/one_test.rb:406-411` ("creating an attachment as part of an autosave association through nested attributes") assigns `avatar:` inside `users_attributes:`. The nested build reaches `new User(...)` (`packages/activerecord/src/nested-attributes.ts`), whose `assignAttributes` raises because `setAvatar` is async. `packages/activestorage/src/attached/one.test.ts` parks it. `activestorage-create-awaits-attachment-writers` covers `create` / `createBang`, not this path.

## Acceptance criteria

- A nested build awaits an attachment writer, with no promise parked for `save` to drain.
- The parked test runs with Rails' name.
