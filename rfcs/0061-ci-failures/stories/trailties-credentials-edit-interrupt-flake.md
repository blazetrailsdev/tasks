---
title: "trailties-credentials-edit-interrupt-flake"
status: draft
updated: 2026-11-21
rfc: "0061-ci-failures"
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

## Context

`packages/trailties/test/commands/credentials.test.ts:348-356`, "edit command does not display save confirmation message if interrupted", failed on trails#10504 (an unrelated pg tooling PR), in CI run <https://github.com/blazetrailsdev/trails/actions/runs/44924897829/job/136908870183> (Trailties Tests (1)):

    AssertionError: expected 'Editing config/credentials.yml.enc...…' not to match /file encrypted and saved/i

The test runs the edit command with `VISUAL="sh -c 'kill -INT $PPID'"` and expects the editor's SIGINT to abort the save. In CI the output still reported "File encrypted and saved", so the interrupt sometimes lands after the save path has already run, or never reaches the parent at all. The Rails counterpart is `vendor/rails/v8.0.2/railties/test/commands/credentials_test.rb` ("edit command does not display save confirmation message if interrupted"), and the code under test is trailties' port of `Rails::Command::Helpers::Editor#system_editor` / `catch_editing_exceptions` (`vendor/rails/v8.0.2/railties/lib/rails/command/helpers/editor.rb`).

## Acceptance criteria

- [ ] Find which process the `kill -INT $PPID` reaches in the trailties port, and why the edit command still saves.
- [ ] The interrupt is handled deterministically, as `catch_editing_exceptions` rescues `Interrupt` and prints "Nothing saved."
- [ ] The test passes reliably under the CI trailties shard. The test name is unchanged.
