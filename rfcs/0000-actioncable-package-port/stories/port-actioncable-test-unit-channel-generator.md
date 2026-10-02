---
title: "Port TestUnit::Generators::ChannelGenerator"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["trailties"]
deps: ["actioncable-package-skeleton"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/rails/generators/test_unit/channel_generator.rb` (22 lines) and
its template `templates/channel_test.rb.tt` (8 lines), ported under
`packages/trailties/src/generators/test-unit/channel/` beside
`test-unit/model` and `test-unit/scaffold`.

- `source_root`, `check_class_collision suffix: "ChannelTest"` (`:8-10`).
- `create_test_files` (`:12-14`): `template "channel_test.rb",
File.join("test/channels", class_path, "#{file_name}_channel_test.rb")`.
- Private `file_name` (`:17-19`):
  `@_file_name ||= super.sub(/_channel\z/i, "")`.

The channel generator reaches it through `hook_for :test_framework`;
`channel_generator_test.rb:120` ("invokes default test framework") is the
Rails case that covers it, ported with the channel generator.

**RFC 0171 (Thor) is converging trailties' generators onto `Thor::Group`.**
Write this generator in whatever shape `NamedBase`
(`packages/trailties/src/generators/named-base.ts:19`) has when the story is
claimed. If 0171's `split-*` stories have not reached the test-unit
generators yet, add this one to the story that does, so it is not left behind.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/test_unit/channel_generator.rb`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/test_unit/templates/channel_test.rb.tt`

## Fidelity traps (predicted at authoring)

- [ ] **`file_name` strips a trailing `_channel`**, case-insensitively, once: `chat_channel` and `chat` both produce `chat_channel_test`.
- [ ] **`class_path` nests the file** for a namespaced name.
- [ ] **The template extends `ActionCable::Channel::TestCase`** with a commented-out example. The trails template extends the exported `ActionCable.Channel.TestCase` and keeps the comment's content.
- [ ] **`check_class_collision` runs at class-definition time** in Rails.

## Acceptance criteria

- [ ] The generator and its template are ported under their Rails names and paths.
- [ ] Generating for `chat` and for `chat_channel` both write `test/channels/chat_channel_test`.

## Definition of done

Folding the test file into the channel generator's own steps does not close this story.
