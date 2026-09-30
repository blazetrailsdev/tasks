---
title: "Port Thor::Argument and Thor::Arguments (the positional parser)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-errors-nested-context-and-version"]
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/thor/v1.3.2/lib/thor/parser/argument.rb` (86 lines): `VALID_TYPES`, readers, `human_name` alias,
  `initialize` (`:8-25`, with its two `ArgumentError`s), `print_default`, `usage`, `required?`,
  `show_default?`, `enum_to_s`, and protected `validate!` / `valid_type?` / `default_banner`.
- `vendor/thor/v1.3.2/lib/thor/parser/arguments.rb` (195 lines): `NUMERIC`, `self.split` (`:8-17`), `self.parse`,
  `initialize`, `parse`, `remaining`, and private `no_or_skip?`, `last?`, `peek`, `shift`,
  `unshift`, `current_is_value?`, `parse_hash`, `parse_array`, `parse_numeric`,
  `parse_string`, `validate_enum_value!`, `check_requirement!`.

## Fidelity traps (predicted at authoring)

- [ ] **Ruby Symbol types.** `type: :numeric` is the string `"numeric"` here (a JS string, not
      a JS `Symbol`). `send(:"parse_#{type}")` is a dispatch on that name. Keep it a lookup of
      the `parse*` method by name, not a `switch` that drops the unknown-type path.
- [ ] **`$&` / `$1` after `=~`.** `parse_numeric` (`:139-151`) reads `$&` from the preceding
      `peek =~ NUMERIC`. The JS port must keep the match object from that same test, and
      `$&.index(".")` picks `to_f` or `to_i`.
- [ ] **`default.dup`** (`arguments.rb:33`) so a parse never mutates a declared Array or Hash
      default.
- [ ] **`!argument.default.nil?`**, not truthiness: a `false` or `0` default is assigned.
- [ ] **`self.class.name.split("::").last.downcase`** in `check_requirement!` (`:191`) needs the
      Ruby class name (`"arguments"` / `"options"`). Read it from a Ruby-name seat, not
      `constructor.name`, which a minifier can rename.
- [ ] **`enum_to_s`** prints a Range as `first..last`. A JS enum has no Range, so the
      non-`join` arm is the ruby-compat `Range` case.
- [ ] **`validate_enum_value!` returns early unless `@switches.is_a?(Hash)`** (`:173`). For
      `Arguments` it is an Array, so the check never runs. Keep that asymmetry.

## Acceptance criteria

- [ ] Both files read complete in `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/parser/argument_spec.rb` (11) and `vendor/thor/v1.3.2/spec/parser/arguments_spec.rb` (9) are ported.

## Cases to port (20)

`vendor/thor/v1.3.2/spec/parser/argument_spec.rb`:

- `errors > raises an error if name is not supplied` (`:10`)
- `errors > raises an error if type is unknown` (`:16`)
- `errors > raises an error if argument is required and has default values` (`:22`)
- `errors > raises an error if enum isn't enumerable` (`:28`)
- `#usage > returns usage for string types` (`:36`)
- `#usage > returns usage for numeric types` (`:40`)
- `#usage > returns usage for array types` (`:44`)
- `#usage > returns usage for hash types` (`:48`)
- `#print_default > prints arrays in a copy pasteable way` (`:54`)
- `#print_default > prints arrays with a single string default as before` (`:61`)
- `#print_default > prints none arrays as default` (`:68`)

`vendor/thor/v1.3.2/spec/parser/arguments_spec.rb`:

- `#parse > parses arguments in the given order` (`:20`)
- `#parse > accepts hashes` (`:30`)
- `#parse > accepts arrays` (`:37`)
- `#parse > accepts - as an array argument` (`:43`)
- `#parse > with no inputs > and no arguments returns an empty hash` (`:50`)
- `#parse > with no inputs > and required arguments raises an error` (`:55`)
- `#parse > with no inputs > and default arguments returns default values` (`:60`)
- `#parse > returns the input if it's already parsed` (`:66`)
- `#parse > returns the default value if none is provided` (`:71`)
