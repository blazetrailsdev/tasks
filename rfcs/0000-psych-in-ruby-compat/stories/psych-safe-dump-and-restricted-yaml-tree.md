---
title: "Port Psych.safe_dump / RestrictedYAMLTree and Psych.dump's options arm"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:505-525` `dump(o, io = nil, options = {})`. Options are `indentation`, `line_width`,
`canonical` and `header`. The one Rails caller passing options is
`devcontainer_generator.rb:146` (via `to_yaml(indentation: 4)`, from
`compose.yaml.tt:41`). No Rails caller passes `io`, so that arm is not
ported (README rule 1). `:578-593` `safe_dump`. `RestrictedYAMLTree`
(`psych/visitors/yaml_tree.rb:540-577`) raises
`DisallowedClass("dump", name)` for an unpermitted class and
`BadAlias` when `aliases: false` would need an alias. #8254's `dump` covers
only `dump(o)`.

Caller: `vendor/rails/v8.0.2/activerecord/lib/active_record/coders/yaml_column.rb:19-23`.
trails' `SafeCoder#assertDumpable` (`activerecord/src/coders/yaml-column.ts`)
hand-rolls the restriction today.

## Acceptance criteria

- [ ] `Psych.safeDump(o, { permittedClasses, permittedSymbols, aliases, ... })`
      runs `RestrictedYAMLTree#accept` (`:565-576`): Array, Hash, String,
      Integer, Float, true/false/nil and permitted classes pass. Others raise
      `DisallowedClass` "Tried to dump unspecified class: <name>".
- [ ] `Psych.dump(o, options)` honours `indentation` (the only option a
      caller passes). Any option the backend cannot honour raises
      `ArgumentError` rather than being dropped silently. The `io` position
      stays in the signature (so parameter names match Rails) and raises
      `NotImplementedError` when it is non-nil.
- [ ] A scalar document dumps as `"--- str\n"` (Psych's inline marker). That
      is `yaml-scalar-dump-document-marker-spacing`'s criterion, now owned by
      the emitter. Collections dump as `"---\n- ok\n"`.
- [ ] Tests and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
