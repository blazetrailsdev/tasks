---
title: "Port thor_spec.rb, part 2 (#start, #help, subcommands, edge cases)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-dispatch-and-help", "port-thor-spec-helper-and-script-fixtures"]
deps-rfc: []
est-loc: 500
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RSpec port of `vendor/thor/v1.3.2/spec/thor_spec.rb` (lines 458–9999).

Port each case at its Ruby name (`describe` / `it` strings unchanged; `parity:test`
matches on them). Expectations map `expect(x).to eq(y)` → `expect(x).toEqual(y)`,
`raise_error(K, /m/)` → `rejects.toThrow` / `toThrow`, and `capture(:stdout) { }` → the
spec helper's `capture("stdout", async () => ...)`. A case that cannot run under trails
(for example, one that shells out to `ruby`) is `it.skip` with the RFC's reason, not deleted.

## Acceptance criteria

- [ ] Every case listed below exists at its Ruby name and passes. `pnpm parity:test` credits it
      in the `thor` block.
- [ ] No case is renamed. A case that exposes a port bug is fixed in the port (or filed against
      this RFC with the Ruby `file:line`), not rewritten.

## Cases to port (52)

`vendor/thor/v1.3.2/spec/thor_spec.rb`:

- `#start > calls a no-param method when no params are passed` (`:458`)
- `#start > calls a single-param method when a single param is passed` (`:462`)
- `#start > does not set options in attributes` (`:466`)
- `#start > raises an error if the wrong number of params are provided` (`:470`)
- `#start > raises an error if the invoked command does not exist` (`:492`)
- `#start > calls method_missing if an unknown method is passed in` (`:496`)
- `#start > does not call a private method no matter what` (`:500`)
- `#start > uses command default options` (`:504`)
- `#start > raises when an exception happens within the command call` (`:509`)
- `#start > invokes a command` (`:514`)
- `#start > invokes a command, even when there's an alias it resolves to the same command` (`:518`)
- `#start > invokes an alias` (`:522`)
- `#start > raises an exception and displays a message that explains the ambiguity` (`:528`)
- `#start > raises an exception when there is an alias` (`:534`)
- `#help > on general > provides useful help info for the help method itself` (`:552`)
- `#help > on general > provides useful help info for a method with params` (`:556`)
- `#help > on general > uses the maximum terminal size to show commands` (`:560`)
- `#help > on general > provides description for commands from classes in the same namespace` (`:566`)
- `#help > on general > shows superclass commands` (`:570`)
- `#help > on general > shows class options information` (`:575`)
- `#help > on general > injects class arguments into default usage` (`:581`)
- `#help > on general > prints class exclusive options` (`:586`)
- `#help > on general > does not print class exclusive options` (`:591`)
- `#help > on general > prints class at least one of requred options` (`:596`)
- `#help > on general > does not print class at least one of required options` (`:601`)
- `#help > for a specific command > provides full help info when talking about a specific command` (`:608`)
- `#help > for a specific command > provides full help info when talking about a specific command with multiple usages` (`:622`)
- `#help > for a specific command > raises an error if the command can't be found` (`:635`)
- `#help > for a specific command > normalizes names before claiming they don't exist` (`:641`)
- `#help > for a specific command > uses the long description if it exists` (`:645`)
- `#help > for a specific command > prints long description unwrapped if asked for` (`:657`)
- `#help > for a specific command > doesn't assign the long description to the next command without one` (`:672`)
- `#help > for a specific command > prints exclusive and at least one options` (`:678`)
- `#help > for a specific command > does not print exclusive and at least one options` (`:685`)
- `#help > instance method > calls the class method` (`:695`)
- `#help > instance method > calls the class method` (`:699`)
- `#help > shows the command help` (`:714`)
- `subcommands > triggers a subcommand help when passed --help` (`:722`)
- `when creating commands > prints a warning if a public method is created without description or usage` (`:734`)
- `when creating commands > does not print if overwriting a previous command` (`:741`)
- `edge-cases > can handle boolean options followed by arguments` (`:750`)
- `edge-cases > method_option raises an ArgumentError if name is not a Symbol or String` (`:765`)
- `edge-cases > class_option raises an ArgumentError if name is not a Symbol or String` (`:773`)
- `edge-cases > passes through unknown options` (`:781`)
- `edge-cases > does not pass through unknown options with strict args` (`:793`)
- `edge-cases > strict args works in the inheritance chain` (`:807`)
- `edge-cases > issues a deprecation warning on incompatible types by default` (`:823`)
- `edge-cases > allows incompatible types if allow_incompatible_default_type! is called` (`:831`)
- ``edge-cases > allows incompatible types if `check_default_type: false` is given`` (`:841`)
- `edge-cases > checks the default type when check_default_type! is called` (`:849`)
- `edge-cases > send as a command name` (`:859`)
- `outputs a deprecation warning on error` (`:871`)
