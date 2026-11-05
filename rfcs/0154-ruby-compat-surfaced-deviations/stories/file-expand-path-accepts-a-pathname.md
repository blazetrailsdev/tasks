---
title: "File.expandPath accepts a Pathname, so generate/destroy pass Command.root unconverted"
status: draft
updated: 2026-11-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `File.expand_path` accepts any object answering `to_path`, so Rails passes a `Pathname`
straight through: `generate_command.rb:26` / `destroy_command.rb:25` hand `Rails::Command.root`
(a Pathname) to Thor's `destination_root=` (`vendor/thor/v1.3.2/lib/thor/actions.rb`,
`File.expand_path(root || "")`). ruby-compat's `File.expandPath` (`packages/ruby-compat/src/file.ts:1059`)
is typed `fileName: string`, so `packages/trailties/src/commands/generate.ts` and `destroy.ts`
write `root()?.toString()`.

## Acceptance criteria

- [ ] `File.expandPath` accepts a `Pathname` (or any `toPath` answerer) as MRI's `rb_get_path` does.
- [ ] Thor's `destinationRoot` setter and `Generators.invoke`'s `destinationRoot` option accept a `Pathname`.
- [ ] `generate.ts` / `destroy.ts` pass `root()` unconverted.
