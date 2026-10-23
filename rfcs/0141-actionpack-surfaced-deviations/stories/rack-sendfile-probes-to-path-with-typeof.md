---
title: "rack-sendfile-probes-to-path-with-typeof"
status: draft
updated: 2026-10-21
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

`Rack::Sendfile#call` checks `body.respond_to?(:to_path)` and, on its error paths,
`obody.respond_to?(:close)` (`vendor/rack/v3.1.14/lib/rack/sendfile.rb:116`, `:126`,
`:137`). trails' `packages/rack/src/sendfile.ts:25` uses
`typeof body.toPath === "function"` and `typeof obody.close === "function"` instead.
A `Rack::Lint::Wrapper` (trails#9181) always defines `toPath` and answers it only
through `isRespondTo` (`lint.rb:910-916`). So Sendfile behind Lint calls
`toPath()` on a body that has none.

Tension to resolve first: the owner ruling of 2026-10-20 (recorded in
`rack-buffered-body-close-native-check`) says a rack body's `respond_to?` check is native JS
(`typeof x.m === "function"`), not ruby-compat's `rbObjRespondTo`. This story asks for the
opposite at `sendfile.ts:30`, because `Lint::Wrapper` defines `toPath` unconditionally and
answers `respond_to?(:to_path)` only through `isRespondTo` (`lint.rb:910-916`). Either
`Lint::Wrapper` stops defining `toPath` when its body lacks one (so the native probe is right),
or the ruling gets a stated exception for wrapped bodies.

## Acceptance criteria

- [ ] `sendfile.ts` probes with `rbObjRespondTo(body, "toPath")` / `rbObjRespondTo(obody, "close")`, as Rails does with `respond_to?`.
- [ ] A test with a Lint-wrapped body that lacks `to_path` passes through Sendfile untouched.
