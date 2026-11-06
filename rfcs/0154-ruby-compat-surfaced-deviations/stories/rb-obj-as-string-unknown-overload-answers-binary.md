---
title: "rbObjAsString's unknown overload is typed string though it returns a Uint8Array unchanged"
status: draft
updated: 2026-11-06
rfc: "0154-ruby-compat-surfaced-deviations"
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

`rbObjAsString` (`packages/ruby-compat/src/object.ts:1939-1946`) has a `Uint8Array` overload and an `unknown` overload typed `string`. The `unknown` overload's body returns a `Uint8Array` unchanged (`:1946`), as `rb_obj_as_string` returns a String receiver itself (`vendor/ruby/v3.3.11/string.c:1653`). So a caller holding `unknown` must cast: `Message`'s constructor (`packages/mail/src/message.ts`) writes `rbObjAsString(first ?? "") as string | Uint8Array`, from trails#9768.

## Acceptance criteria

- The `unknown` overload answers `string | Uint8Array`, and callers that need a `string` narrow at the call site.
- The cast in `Message`'s constructor is removed.
