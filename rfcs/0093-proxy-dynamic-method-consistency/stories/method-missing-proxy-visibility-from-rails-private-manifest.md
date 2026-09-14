---
title: "methodMissingProxy visibility reads the Ruby private-method manifest, not the underscore heuristic"
status: closed
updated: 2026-09-14
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "No live failure and no test pressure: Migration dispatches by instanceof (migration.ts:265,874,937), not visibility, so the proxy's has trap never picks a code path; the get trap checks Reflect.has(proxyTarget) first, so a forwarded adapter private cannot shadow a CommandRecorder method. Rails' own command_recorder_test.rb has no private-visibility test. Exposure is real (~110 Ruby-private members publicly spelled across abstract-adapter.ts, abstract/schema-statements.ts, abstract/database-statements.ts) but one-directional: trails accepts what Rails rejects, which never breaks a working migration. The adapter is the only delegate with a Rails counterpart -- UploadedFile's tempfile and DelegateClass's __getobj__ are not in the manifest and would keep the underscore fallback regardless. Remaining risk is a porting hazard only (a ported body calling an adapter-private through the recorder goes green where Rails raises), which does not justify a new runtime visibility mechanism in ruby-compat plus ~110 declarations."
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
