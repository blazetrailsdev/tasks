---
title: "methodMissingProxy visibility reads the Ruby private-method manifest, not the underscore heuristic"
status: blocked
updated: 2026-08-09
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-09T01:00:45Z"
assignee: "converge-fixture-teardown-delete-onto-a-live-connection"
blocked-by: "eslint/rails-private-methods.json is not committed (git ls-files eslint/ lists only the rule + config) and per eslint/rails-private-jsdoc.config.mjs:4-10 exists only in the rails-comparison CI job, which is the only job with Ruby. eslint/rails-private-jsdoc.mjs:26-31 reads it with sync fs and degrades to {files:{}} when absent. A runtime package cannot do either: node:* imports and process.* are banned in packages/, fs must be async, and an eager JSON import would fail the build in every job without Ruby. Unblock once rails-private-method-set-must-be-a-committed-runtime-artifact (0093) makes the private set a committed, freshness-gated artifact a runtime package can import."
closed-reason: null
---

## Context

`methodMissingProxy` (`packages/activesupport/src/method-missing-proxy.ts`) mirrors
Rails' public-only `respond_to?` / `public_send`
(`activerecord/lib/active_record/migration/command_recorder.rb:396,401`) with a
heuristic: `respondsTo()` treats a delegate member as private iff its name starts
with `_` (the trails convention). That under-approximates Ruby. A member that is
`private`/`protected` in the Ruby source but ported without an underscore prefix
— every `private` section in a ported adapter, for instance — is still forwarded
by `get` and still answered `true` by `has`, where `respond_to?` answers `false`.

The manifest that knows the real answer already exists: `pnpm parity:api` writes
`eslint/rails-private-methods.json` ("604 files (5004 names)"), the Ruby-side
private set keyed by file. PR #6252 shipped the heuristic rather than wiring the
manifest, because the manifest is generated for lint and is not currently loaded
at runtime by any package.

## Converged shape

Drive `respondsTo()` from the Ruby-side private set for the delegate's file
rather than from the name spelling, so visibility matches
`command_recorder.rb:396,401` for delegates whose private members are not
underscore-prefixed. Keep the underscore rule only as the fallback for a
delegate with no Rails counterpart. Needs a decision on how a runtime package
reads a generated eslint manifest without a build-time import (an eager JSON
import into activesupport is a new load-order edge).

## Acceptance criteria

- [ ] A delegate member that is `private` in the Rails source but has no `_`
      prefix in the port is neither forwarded by `get` nor answered by `has`.
- [ ] The underscore rule still covers delegates with no Rails counterpart.
- [ ] `command-recorder` ported + trails suites stay green; `pnpm parity:api:extra`
      shows no new surface.
