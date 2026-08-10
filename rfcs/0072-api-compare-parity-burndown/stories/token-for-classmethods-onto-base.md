---
title: "Install TokenFor::ClassMethods on Base instead of the generates-token-for subpath"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6106
claim: "2026-08-05T00:11:03Z"
assignee: "pin-fixture-pools-via-connection-notification"
blocked-by: null
closed-reason: null
---

## Context

`generates_token_for` is a class method on every `ActiveRecord::Base` subclass:
`token_for.rb` declares `module ClassMethods` + `extend ActiveSupport::Concern`,
and `vendor/rails/activerecord/lib/active_record/base.rb:328` does
`include TokenFor`.

trails keeps it behind the `@blazetrails/activerecord/generates-token-for`
subpath, with `packages/activerecord/src/index.ts:289` saying "generatesTokenFor
requires node:crypto — use subpath". PR #6100 disproved that premise for the
sibling module: `getCrypto()`
(`packages/activesupport/src/crypto-adapter.ts`) resolves `node:crypto` lazily
inside `resolve()` and `key-generator.ts` has no static node import, so
`base.ts` importing the module pulls in no crypto at load time. `secure-token.ts`
is now wired onto `Base` (`static hasSecureToken` / `static
generateUniqueSecureToken`, base.ts after the `Store` members, mirroring
base.rb:326-327) with the conditional install deleted.

## Converged shape

Same treatment for `generates-token-for.ts`: verify its crypto reach goes
through the `getCrypto()` seam (or make it lazy if it does not), assign the
`TokenFor::ClassMethods` members onto `Base` in `base.rb:328`'s position —
after the `SecureToken` members — and delete the subpath-only comment at
`index.ts:289`. Keep the subpath export for anything genuinely server-only.

## Acceptance criteria

- `Base.generatesTokenFor` (and the rest of `TokenFor::ClassMethods`) exists
  without importing the subpath.
- No static `node:crypto` import reaches `index.ts`; the browser/bundler lane
  stays green.
- `pnpm parity:api:extra --package activerecord` does not regress `generates-token-for.ts`.
