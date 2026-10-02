---
title: "Thor::Shell's loose delegate types, MyCounter stand-in and optional Base.shell"
status: draft
updated: 2026-10-02
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #8360 ported `Thor::Shell` (`vendor/thor/v1.3.2/lib/thor/shell.rb`) ahead of the code it
delegates to, and left two transitional shapes in `packages/trailties/src/thor/`:

- `shell.ts`: eight of the 13 generated delegates (`shell.rb:57-63`) — `ask`, `isYes`, `isNo`,
  `printInColumns`, `printTable`, `printWrapped`, `fileCollision`, `terminalWidth` — are typed
  `(...args: unknown[]): unknown` and reach the shell through a `Delegated` cast, because
  `Shell::Basic` has no such members yet. The other five use `Parameters<Basic["…"]>`.
- `shell.test.ts`: `shell_spec.rb`'s `MyCounter` (`vendor/thor/v1.3.2/spec/fixtures/group.thor`) is
  a local stand-in class that calls `initializeIncludedModules(this, args, options, config)`, and
  `Thor::Base.shell = Thor::Shell::Basic` (`spec/helper.rb:29`) is set at the top of the file.
- `Base.shell` is typed `ShellClass | undefined` and read as `new Base.shell!()` until
  `Shell::Color` is seated.

## Acceptance criteria

- [ ] Once `Shell::Basic` gains each member, its delegate is typed from `Basic` and the
      `Delegated` type is deleted.
- [ ] `shell.test.ts` uses the ported `MyCounter` fixture and the ported spec helper.
- [ ] Once `Shell::Color` is seated, `Base.shell` answers `ShellClass` with no `!` at its readers.
