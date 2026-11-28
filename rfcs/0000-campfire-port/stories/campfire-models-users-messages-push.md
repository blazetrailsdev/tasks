---
title: "Campfire example: User, Message, Push, Session, Sound, Webhook and ApplicationPlatform models with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, activerecord, actiontext]
deps: [campfire-app-skeleton, platform-agent-port, campfire-lib-rails-ext-and-restricted-http]
deps-rfc: []
est-loc: 1950
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `user.rb` and `user/` (294 lines), `message.rb` and
`message/` (287), `push/` (61), `session.rb`, `sound.rb`, `webhook.rb`,
`application_platform.rb` (`< PlatformAgent`); tests `user*`, `message*`,
`push/`, `session_test.rb`, `webhook_test.rb`,
`action_text_attachment_test.rb` (about 1,050 lines). `Message` has
`has_rich_text :body`; `User#close_remote_connections` is
`remote_connections.where(current_user: self).disconnect`.
`Push::Subscription#notification` builds a `WebPush::Notification`; its
delivery is `campfire-jobs-web-push-and-wal-checkpoint`.
`Push::Subscription#resolved_endpoint_ip` calls
`RestrictedHTTP::PrivateNetworkGuard.resolve` and rescues
`Surfguard::Unresolvable` (`app/models/push/subscription.rb:23-27`).

## Acceptance criteria

- [ ] each listed model and concern ported file for file
- [ ] each listed test file ported and passing on SQLite

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
