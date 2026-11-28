---
title: "Campfire example: lib/rails_ext and RestrictedHTTP with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actiontext, activestorage]
deps: [campfire-app-skeleton, surfguard-port]
deps-rfc: []
est-loc: 850
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `lib/rails_ext/` except `sqlite_wal_checkpoint.rb`
(`actiontext_opengraph_embeds.rb` 108 lines, `action_text_attachables.rb`,
`action_text_allowed_tags.rb`, `time_limited_video_previewer.rb`,
`filter.rb`, `filters.rb`, `log_scrubbing_formatter.rb`, `string.rb`),
`lib/restricted_http/private_network_guard.rb` (calls
`Surfguard.resolve_public_ips`), `lib/tasks/generate.rake` and
`room_messages_count.rake`; tests `test/lib/rails_ext/`, `restricted_http/`,
`vips_loader_policy_test.rb` (about 500 lines). Several files reopen framework
classes; each reopen follows trails CLAUDE.md, "A Ruby module is a JS object
or a JS class", or files an operator question.

## Acceptance criteria

- [ ] each listed file ported file for file
- [ ] each listed test file ported and passing

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
