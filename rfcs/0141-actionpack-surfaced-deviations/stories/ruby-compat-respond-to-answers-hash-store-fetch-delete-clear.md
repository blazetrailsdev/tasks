---
title: "ruby-compat-respond-to-answers-hash-store-fetch-delete-clear"
status: ready
updated: 2026-10-22
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

Ruby `Hash` answers `respond_to?` for `store`, `[]=`, `fetch`, `[]`, `delete`, `clear`
and `to_hash`. ruby-compat's `basicObjRespondTo` (`packages/ruby-compat/src/object.ts`)
binds `get` and `toHash` for a plain hash but not `store` / `set` / `fetch` / `delete` /
`clear`, so `Rack::Lint::Wrapper#check_environment`'s session checks
(`vendor/rack/v3.1.14/lib/rack/lint.rb:150-177`) reject a plain-object `rack.session`.
`packages/rack/src/lint.ts` skips those checks for a plain hash under
`@inventedArm isPlainHash — CONVERGEABLE ruby-compat-respond-to-answers-hash-store-fetch-delete-clear`.

## Acceptance criteria

- [ ] `basicObjRespondTo` answers `store`, `set`, `fetch`, `delete`, `clear` for a plain hash and a `Map`, and `rbFSend` dispatches them (`hash.c` citations).
- [ ] The `isPlainHash` arm and its receipt are removed from `checkEnvironment`; rack-session / rack-test tests still pass.
