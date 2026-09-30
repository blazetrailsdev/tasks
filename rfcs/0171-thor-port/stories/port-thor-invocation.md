---
title: "Port Thor::Invocation (invoke, invoke_command, invoke_all, shared configuration) and ratify the async dispatch cascade"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-base-command-registry-method-added-and-start",
    "port-thor-util",
    "port-thor-shell-module-basic-output-and-terminal",
  ]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/invocation.rb` (178 lines): `included` (extends `ClassMethods`),
`ClassMethods#prepare_for_invocation` (`:12-19`), `initialize` (`:23-27`, `@_invocations` as a
`Hash.new { |h,k| h[k] = [] }` shared through `config[:invocations]`), `current_command_chain`,
`invoke` (`:102-119`), `invoke_command` (`:122-129`, run-once per class), `invoke_all`
(`:133-135`), `invoke_with_padding`, and protected `_shared_configuration`,
`_retrieve_class_and_command` (`:153-162`) and `_parse_initialization_options` (`:166-176`).

trailties copies this in `GeneratorBase#invoke` / `invokeCommand` / `invokeAll` /
`_retrieveClassAndCommand` / `_parseInitializationOptions` / `_sharedConfiguration`
(`packages/trailties/src/generators/base.ts:553-665`). The consumer story deletes them.

## Design (RFC decision 4)

`invoke`, `invoke_command`, `invoke_all`, `invoke_with_padding`, `Command#run`, `dispatch`
and `start` are async. `invoke_all` awaits each command **in order**. It is
`self.class.all_commands.map { ... }` in Ruby, and a JS `Promise.all` over that map would run
the steps concurrently. This story adds the CLAUDE.md section **"Thor dispatch is async"**,
which ratifies the cascade (prompts → shell → actions → commands → invoke → dispatch → start)
with the alternatives from the RFC.

## Fidelity traps (predicted at authoring)

- [ ] **Module `initialize` chains through `super`**: Invocation, Shell and Actions each wrap
      `Thor::Base#initialize`. In TS the order is fixed by the `include()` order:
      `Base` includes `Invocation` then `Shell` (`vendor/thor/v1.3.2/lib/thor/base.rb:116-121`), and `Actions`
      (`vendor/thor/v1.3.2/lib/thor/actions.rb:72-85`) is included by the user class. Assert the resulting
      `_initializer`, `shell` and `destination_root`.
- [ ] **`@_invocations` default proc**: `current[...]` autovivifies `[]` per class key. A JS
      `Map` keyed by class needs an explicit get-or-create.
- [ ] **`args.unshift(nil) if args.first.is_a?(Array) || args.first.nil?`** (`:108`) sets the
      positional shape of `(command, args, opts, config)`.
- [ ] **`raise "Expected Thor class, got #{klass}" unless klass <= Thor::Base`**: `<=` is
      "is a descendant of (or is) the module". Use the ancestry check, not `instanceof`.
- [ ] **`stored_config.merge(_shared_configuration).merge!(config)`**: `_shared_configuration`
      is extended by Shell (`shell:`) and Actions (`destination_root:`) through `super`.

## Acceptance criteria

- [ ] `invocation.rb` reads complete in `parity:api --package thor`.
- [ ] The CLAUDE.md section is added.
