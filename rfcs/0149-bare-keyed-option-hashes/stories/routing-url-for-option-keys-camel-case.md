---
title: "ActionView RoutingUrlFor writes camelCase url option keys (onlyPath, host) like actionpack reads"
status: done
updated: 2026-09-23
rfc: "0149-bare-keyed-option-hashes"
cluster: option-hash-key-names
packages: [actionview]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7991
claim: "2026-09-22T23:45:17Z"
assignee: "routing-url-for-option-keys-camel-case"
blocked-by: null
closed-reason: null
---

## Context

trails spells Ruby option keys in camelCase (`docs/ruby-ts-conventions.md`: `snake_case` → `camelCase`), so Rails'
`:only_path` is `onlyPath`. actionpack follows that: `UrlOptions` in
`packages/actionpack/src/action-dispatch/http/url.ts:11-26` reads `onlyPath`, `scriptName`, `trailingSlash`. ActionView
does not. `packages/actionview/src/routing-url-for.ts` writes and reads the Ruby spelling: `{ only_path: ... }` (`:19`),
`opts["only_path"]` (`:36`), and `ensureOnlyPathOption` (`:81-93`, Rails `routing_url_for.rb:139-145`) checks and sets
`only_path`. So a hash ActionView builds carries a key actionpack never reads.

## Acceptance criteria

- `RoutingUrlFor#urlFor` and `ensureOnlyPathOption` read and write `onlyPath` on hashes. The `ActionController::Parameters` arm keeps Parameters' own key spelling.
- A test shows `urlFor({ controller, action })` from a view produces a path, not a full URL, by default. It must fail before the fix.
- No `symbolizeKeys` call (RFC Design, "Rule").
