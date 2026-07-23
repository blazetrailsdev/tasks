---
title: "fetch-nil-presence-divergences-globalid-rack"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T12:28:36Z"
assignee: "fetch-nil-presence-divergences-globalid-rack"
blocked-by: null
closed-reason: null
---

## Context

Found by Codex review on PR #5096, sharpening two entries from the per-entry
wide-call verification. Ruby `Hash#fetch(key, default)` applies the default
only when the KEY IS ABSENT — an explicitly supplied nil is returned as nil.
Two trails ports collapse that distinction:

- `SignedGlobalID.pick_purpose`
  (vendor/globalid/lib/global_id/signed_global_id.rb:24-26):
  `options.fetch :for, DEFAULT_PURPOSE` — `for: nil` yields a nil purpose
  (purpose verification disabled). Trails
  (packages/globalid/src/signed-global-id.ts:207-209) uses
  `options.for ?? DEFAULT_PURPOSE`, which coerces an explicit null back to
  the default.
- `Rack::Deflater#initialize` (vendor/rack/lib/rack/deflater.rb:39-44):
  `@sync = options.fetch(:sync, true)` — `sync: nil` stays nil (falsy, so
  streaming sync off). Trails (packages/rack/src/deflater.ts:28-33) uses
  `opts.sync !== false`, which coerces every non-false value (including
  null) to true.

## Acceptance criteria

- Both ports preserve Rails' key-present semantics (explicit null honored;
  only an absent/undefined key takes the default), with regression tests that
  fail on the current baseline.
- The two wide-exclude reasons updated to plain verified wording once
  converged.
