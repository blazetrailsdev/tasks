---
title: "The suite boots the application, so tests run under its configuration"
status: in-progress
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trailmap#97
claim: "2026-10-30T09:26:35Z"
assignee: "sessions-show-page-pr-timeline"
blocked-by: null
closed-reason: null
---

## Context

The vitest suite imports models without booting the application, so `config.loadDefaults("8.0")` never applies there. Rails' 8.0 defaults set `active_record.belongs_to_required_by_default = true` (`railties/lib/rails/application/configuration.rb:123`), so in the deployed app `Story belongs_to :rfc` is required, and in the suite it is optional.

`test/models/ranking.test.ts` ("scopes the queue to an RFC…") saves a story before its RFC exists. It passes only because of that gap: the Rails twin's port of the same test fails until the RFC is created first. The CSRF gap in `the-json-api-skips-forgery-protection` hides behind the same mismatch.

In Rails, `test_helper.rb` requires `config/environment`, so tests run under the application's configuration.

## Acceptance criteria

- [ ] The suite boots the application once (`config/environment`), as Rails' `test_helper.rb` does, before model and controller tests run.
- [ ] Tests that relied on the unbooted defaults are fixed to the booted ones.
