---
title: "tse-call-encoding-segment-and-valid-encoding"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

# Port Handlers::ERB#call's encoding segment and valid_encoding into Tse

## Context

`ActionView::Template::Handlers::ERB#call` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb:63-77`) strips the `ENCODING_TAG` from a binary copy of the source, calls `valid_encoding(source.dup, encoding)` (`:95-108`: `force_encoding` when a magic comment named one, return `string.encoding` if `valid_encoding?`, else raise `WrongEncodingError`) and `encode!`s the result. `Tse#call` (`packages/actionview/src/template/handlers/tse.ts`) has none of this, and `validEncoding` is unported. Per root CLAUDE.md § "A String has no encoding tag either", the UTF-8 arm is portable: `Template#encodeBang` (`packages/actionview/src/template.ts:180-204`) already ports the same shape with ruby-compat's `forceEncoding` / `isValidEncoding` / `rbObjEncoding`.

## Acceptance criteria

- `validEncoding(string, encoding)` is ported on `Tse` as a private member with Rails' three arms, raising `WrongEncodingError`.
- `Tse#call` strips the encoding tag and calls `validEncoding` as `erb.rb:68-76` does.
- `template/handlers/erb.rb` shows 0 missing in `pnpm parity:api --package actionview`.
