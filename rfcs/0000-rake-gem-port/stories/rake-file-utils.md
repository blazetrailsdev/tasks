---
title: "Port Rake::FileUtilsExt and its FileUtils extensions"
status: draft
updated: 2026-10-29
rfc: "0000-rake-gem-port"
cluster: port
packages: [rake]
deps: [rake-package-skeleton]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rake/v13.2.1/lib/rake/file_utils.rb` (`sh`, `ruby`, `safe_ln`, `split_all`) and `file_utils_ext.rb` (`verbose`, `nowrite`, `when_writing`, `rake_check_options`), over ruby-compat's `FileUtils`. `sh` shells out through ruby-compat's process layer, as Ruby's `system` does.

## Acceptance criteria

- [ ] Ported at the Ruby paths and names; `sh` raises the same `RuntimeError` "Command failed with status (…)" and yields `ok, status` to a block.
- [ ] `verbose` / `nowrite` flags gate output and writes as Ruby does.
- [ ] `test/test_rake_file_utils.rb` and `test_rake_file_utils_ext.rb` (where present) port as native Vitest (`expect` and `@blazetrails/vitest-matchers`, per the rake RFC § "Tests are native Vitest"), names matching for `parity:test`; `ruby`-subprocess arms that need an MRI are parked under `PERMANENT-SKIP:` citing CLAUDE.md § "Runtime facts Node does not expose" only if no Node analogue exists.
