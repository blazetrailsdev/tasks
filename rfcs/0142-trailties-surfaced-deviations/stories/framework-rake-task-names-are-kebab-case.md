---
title: "Framework rake task names are kebab-case (action-mailbox:install, action-text:install)"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Root `CLAUDE.md` "Casing is translated, never mirrored" makes CLI tokens kebab-case. Rake tasks the framework packages define are still snake_case:

- `packages/actionmailbox/lib/tasks/install.rake.ts:7` defines `action_mailbox:install` and invokes the generator as `"action_mailbox:install"` (`:9`). The generator is registered as `action-mailbox:install` (`packages/trailties/lib/generators.ts:271`); it resolves only because lookup folds through `dasherize(underscore(namespace))` (`generators.ts:209`).
- `packages/actionmailbox/lib/tasks/ingress.rake.ts:6-69` defines `action_mailbox:ingress:{environment,exim,postfix,qmail}`.
- `packages/actiontext/lib/tasks/actiontext.rake.ts:7,9` defines `action_text:install`.
- activestorage's `active_storage:*` tasks, and the other `lib/tasks/*.ts` with a snake_case namespace (11 hits for `"action_text|active_storage:|action_mailbox:"`).

Rails: `vendor/rails/v8.0.2/actionmailbox/lib/tasks/install.rake`, `ingress.rake`; `vendor/rails/v8.0.2/actiontext/lib/tasks/actiontext.rake`.

## Acceptance criteria

- [ ] Every framework rake namespace and task name is kebab-case (`action-mailbox:install`, `action-mailbox:ingress:postfix`, `action-text:install`, `active-storage:…`), and the generator names passed to `Trails.Command.invoke` are the registered kebab spelling.
- [ ] The website guides (`action-mailbox-basics.md`, `action-text-overview.md`) and generated templates that name these tasks are updated to match.
- [ ] Whether a snake_case task name is still accepted as input follows the ruling in RFC 0171 decision 6 for commands.
