---
title: "pathname-answers-read-write-delete"
status: claimed
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-03T14:27:04Z"
assignee: "intermediate-namespaces-seated-drop-const-get-full-path-row"
blocked-by: null
closed-reason: null
---

## Context

ruby-compat `Pathname` (`packages/ruby-compat/src/pathname.ts`) has no `read`, `write`, `delete` or `empty?`, so `Diffing` (`vendor/rails/v8.0.2/railties/lib/rails/commands/credentials/credentials_command/diffing.rb:17-23`) goes through `File.*Async`.

## Acceptance criteria

- [ ] `Pathname` answers async `read`, `write`, `delete` and `isEmpty`.
- [ ] `Diffing` calls them and its `@missingRailsCall delete` receipt is removed.
