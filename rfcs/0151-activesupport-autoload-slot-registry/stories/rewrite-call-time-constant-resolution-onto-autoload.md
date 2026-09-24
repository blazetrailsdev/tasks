---
title: "Rewrite CLAUDE.md § Call-time constant resolution for the ActiveSupport::Autoload shape"
status: blocked
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages: []
deps:
  - "converge-activerecord-association-slots-onto-autoload"
  - "converge-activerecord-core-slots-onto-autoload"
  - "converge-activemodel-and-actionview-slots-onto-autoload"
  - "converge-activesupport-slots-onto-autoload"
  - "converge-actionpack-rack-session-trailties-slots-onto-autoload"
  - "converge-activerecord-support-db-slots"
deps-rfc: []
est-loc: 60
priority: 22
pr: null
claim: null
assignee: null
blocked-by: "AC requires zero *slot*.ts modules; two activerecord slots on origin/main (2026-09-24) still have no converging story in any RFC: reflection-slot.ts (_setReflection, trails#7813) and tasks/database-tasks-slot.ts (_setDatabaseTasks, trails#7990). connection-adapters-slot.ts and type-metadata-slots.ts now have stories (wired as deps). Unblock once stories for the remaining two exist and are wired as deps."
closed-reason: null
---

## Context

CLAUDE.md § "Call-time constant resolution (Ruby autoload → the zero-import slot)" says "Fifteen instances exist and are the only ones", but there are 25 slot modules on main. Once every package has migrated, the section's instance list and zero-import-slot mechanism are obsolete.

## Acceptance criteria

- The section describes the ported `ActiveSupport::Autoload` shape (registration, call-time read, unguarded read, `eagerLoadBang`), cites `dependencies/autoload.rb`, and carries no per-instance list.
- It keeps the rule that a registration is added only when a plain import actually closes a cycle, and keeps the `dist` entry-module verification requirement.
- `git ls-files 'packages/*/src/**/*slot*.ts' | grep -v test | grep -v src/support/ar-db-slots.ts` is empty (`ar-db-slots.ts` is the test-DB pool sizer, not a constant slot).
