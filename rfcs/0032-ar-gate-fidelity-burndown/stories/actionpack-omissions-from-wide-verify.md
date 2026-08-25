---
title: "actionpack-omissions-from-wide-verify"
status: closed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "not focused on actionpack right now"
---

## Context

Omissions found by per-entry wide-call verification, actionpack cluster —
each verified against the vendored Rails body:

- `TestCase#controller_class_name` (actionpack test_case.rb:552-554) branches
  on `anonymous?`; trails test-case.ts:132-134 has no anonymous handling.
- `Integration::Session#url_options` (testing/integration.rb:140-150)
  reverse-merges `controller.url_options` and `app.routes.default_url_options`;
  trails testing/integration.ts:186-195 merges only defaults+host/protocol.
- `Mime::Type#ref` (http/mime_type.rb:285-287) is `symbol || to_s`; trails
  http/mime-type.ts:194-196 drops the to_s fallback for symbol-less types.
- `pick_template_for_etag` (metal/etag_with_template_digest.rb:49-53) resolves
  via `lookup_context.find_all(...).first&.virtual_path`; trails
  metal/etag-with-template-digest.ts:60-66 falls back to actionName.
- `SystemTesting::Driver#browser_options` (system_testing/driver.rb:51-53)
  merges `@browser.options`; trails system-testing/driver.ts:89-91 returns a
  bare copy of options.

## Acceptance criteria

- Each gap either converged on the Rails body or split into its own scoped
  story with a written rationale; wide-exclude reasons updated to match.
