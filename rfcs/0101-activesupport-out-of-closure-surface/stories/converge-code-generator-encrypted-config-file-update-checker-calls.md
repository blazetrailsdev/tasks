---
title: "converge-code-generator-encrypted-config-file-update-checker-calls"
status: draft
updated: 2026-10-28
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Converge the call rows surfaced by retiring code_generator / encrypted_configuration / file_update_checker unported rows

## Context

`code_generator.rb`, `encrypted_configuration.rb` and `/file_update_checker.rb` were still listed in `scripts/parity/unported-files/activesupport.ts` though each has a port (`packages/activesupport/src/code-generator.ts`, `encrypted-configuration.ts`, `file-update-checker.ts`). Retiring those rows (so `parity:class-paths` names their classes) exposed the bodies to the call gates, and the rows were baselined pending this story:

- `CodeGenerator::MethodSet#define_cached_method` omits `@methods.fetch(as) do … end` (`vendor/rails/v8.0.2/activesupport/lib/active_support/code_generator.rb:15-26`); TS reads `this.methods.get(as)`.
- `CodeGenerator#execute` omits `@namespaces.each_value` and `@owner.class_eval` (`code_generator.rb:69-77`).
- `EncryptedConfiguration#validate!` omits `each_key` with its `key.to_sym` / `rescue NoMethodError` (`encrypted_configuration.rb:69-75`).
- `EncryptedConfiguration#options` passes `this._config` where Rails passes `config` (`encrypted_configuration.rb:112-114`); naming row receipted with `@missingRailsName`.
- `FileUpdateChecker#updated_at` uses `new Date(0)` where Rails calls `Time.at(0)` (`file_update_checker.rb:111-113`).

## Acceptance criteria

- [ ] Each body makes the Rails call (or its settled ruby-compat spelling), and its `call-mismatches-exclude/activesupport/*.json` row and receipt are deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
