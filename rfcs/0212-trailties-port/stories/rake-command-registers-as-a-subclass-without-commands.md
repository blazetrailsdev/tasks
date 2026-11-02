---
title: "RakeCommand registers as a subclass without a manual push"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Base` subclasses register through `Class#subclasses` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:117`). trails seats them in `Base.methodAdded` (`packages/trailties/src/command/base.ts:100-103`), so a class with no commands never registers, and `packages/trailties/src/commands/rake.ts` pushes itself into `subclasses()` in its static block.

## Acceptance criteria

- A command class with no commands registers the same way as every other subclass, and `RakeCommand` has no `subclasses().push`.
