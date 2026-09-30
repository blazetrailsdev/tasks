---
title: "activerecord: CommandRecorder's inverse table is Rails' Hash, not 18 invented invert methods"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md admits two receipt shapes, `PERMANENT` and `CONVERGEABLE <story-id>`. These receipts say
`CONVERGEABLE` and then carry prose instead of a story id, so nothing tracks them
(`name-stories-for-activerecord-malformed-deviation-receipts`, RFC 0127, counts 92 such sites repo-wide;
`convergeable-tag-story-id`, RFC 0120, makes the shape an error). This story is the convergence the
prose promises, for:

- `migration/command-recorder.ts:184` `@noRailsEquivalent` — CONVERGEABLE the execute_block: :execute_block entry of CommandRecorder's inverse table (command_recorder.rb:158) as a method.
- `migration/command-recorder.ts:192` `@noRailsEquivalent` — CONVERGEABLE CommandRecorder#invert_create_join_table (command_recorder.rb:176).
- `migration/command-recorder.ts:200` `@noRailsEquivalent` — CONVERGEABLE the drop_join_table: :create_join_table inverse entry (command_recorder.rb:160) as a method.
- `migration/command-recorder.ts:208` `@noRailsEquivalent` — CONVERGEABLE the add_column: :remove_column inverse entry (command_recorder.rb:161) as a method.
- `migration/command-recorder.ts:226` `@noRailsEquivalent` — CONVERGEABLE the add_index: :remove_index inverse entry (command_recorder.rb:162) as a method.
- `migration/command-recorder.ts:263` `@noRailsEquivalent` — CONVERGEABLE the add_timestamps: :remove_timestamps inverse entry (command_recorder.rb:163) as a method.
- `migration/command-recorder.ts:271` `@noRailsEquivalent` — CONVERGEABLE the remove_timestamps: :add_timestamps inverse entry (command_recorder.rb:163) as a method.
- `migration/command-recorder.ts:279` `@noRailsEquivalent` — CONVERGEABLE the add_reference: :remove_reference inverse entry (command_recorder.rb:164) as a method.
- `migration/command-recorder.ts:292` `@noRailsEquivalent` — CONVERGEABLE CommandRecorder#invert_remove_reference (command_recorder.rb:176).
- `migration/command-recorder.ts:376` `@noRailsEquivalent` — CONVERGEABLE the add_exclusion_constraint: :remove_exclusion_constraint inverse entry (command_recorder.rb:167) as a method.
- `migration/command-recorder.ts:442` `@noRailsEquivalent` — CONVERGEABLE CommandRecorder#invert_change_column, which Ruby defines only to raise IrreversibleMigration (command_recorder.rb:53).
- `migration/command-recorder.ts:486` `@noRailsEquivalent` — CONVERGEABLE the [:add_columns, args] return of CommandRecorder#invert_remove_columns (command_recorder.rb:233), which Ruby reaches by inversion rat
- `migration/command-recorder.ts:564` `@noRailsEquivalent` — CONVERGEABLE the create_enum: :drop_enum inverse entry (command_recorder.rb:170) as a method.
- `migration/command-recorder.ts:572` `@noRailsEquivalent` — CONVERGEABLE the enable_extension: :disable_extension inverse entry (command_recorder.rb:169) as a method.
- `migration/command-recorder.ts:580` `@noRailsEquivalent` — CONVERGEABLE the disable_extension: :enable_extension inverse entry (command_recorder.rb:169) as a method.
- `migration/command-recorder.ts:588` `@noRailsEquivalent` — CONVERGEABLE the create_schema: :drop_schema inverse entry (command_recorder.rb:171) as a method.
- `migration/command-recorder.ts:596` `@noRailsEquivalent` — CONVERGEABLE the drop_schema: :create_schema inverse entry (command_recorder.rb:171) as a method.
- `migration/command-recorder.ts:604` `@noRailsEquivalent` — CONVERGEABLE the create_virtual_table: :drop_virtual_table inverse entry (command_recorder.rb:172) as a method.

`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/command_recorder.rb:158-176` declares the inverse table (`execute_block: :execute_block`, `add_column: :remove_column`, …) and generates the `invert_…` methods from it with `define_method`; trails writes each entry as a hand-written method.

## Acceptance criteria

- [ ] Each of the 18 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.
