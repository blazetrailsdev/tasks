---
title: "Port base_spec.rb (initialize, argument, class options and help, namespace, group, commands, start, attr_*)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-base-command-registry-method-added-and-start",
    "port-thor-spec-helper-and-script-fixtures",
    "port-thor-spec-group-and-invoke-fixtures",
  ]
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

The RSpec port of `vendor/thor/v1.3.2/spec/base_spec.rb`.

Port each case at its Ruby name (`describe` / `it` strings unchanged; `parity:test`
matches on them). Expectations map `expect(x).to eq(y)` → `expect(x).toEqual(y)`,
`raise_error(K, /m/)` → `rejects.toThrow` / `toThrow`, and `capture(:stdout) { }` → the
spec helper's `capture("stdout", async () => ...)`. A case that cannot run under trails
(for example, one that shells out to `ruby`) is `it.skip` with the RFC's reason, not deleted.

`#subclass_files` (2) is recorded unported (Runner-only) by `enroll-thor-specs-in-parity-test`.

## Acceptance criteria

- [ ] Every case listed below exists at its Ruby name and passes. `pnpm parity:test` credits it
      in the `thor` block.
- [ ] No case is renamed. A case that exposes a port bug is fixed in the port (or filed against
      this RFC with the Ruby `file:line`), not rewritten.

## Cases to port (51)

`vendor/thor/v1.3.2/spec/base_spec.rb`:

- `#initialize > sets arguments array` (`:13`)
- `#initialize > sets arguments default values` (`:19`)
- `#initialize > sets options default values` (`:24`)
- `#initialize > allows options to be given as symbols or strings` (`:29`)
- `#initialize > creates options with indifferent access` (`:37`)
- `#initialize > creates options with magic predicates` (`:42`)
- `#no_commands > avoids methods being added as commands` (`:49`)
- `#argument > sets a value as required and creates an accessor for it` (`:57`)
- `#argument > does not set a value in the options hash` (`:62`)
- `#arguments > returns the arguments for the class` (`:68`)
- `#class_exclusive_option_names > returns the exclusive option names for the class` (`:74`)
- `#class_at_least_one_option_names > returns the at least one of option names for the class` (`:81`)
- `#class_exclusive > raise error when exclusive options are given` (`:88`)
- `#class_at_least_one > raise error when at least one of required options are not given` (`:105`)
- `:aliases > supports string aliases without a dash prefix` (`:123`)
- `:aliases > supports symbol aliases` (`:127`)
- `#class_option > sets options class wise` (`:134`)
- `#class_option > does not create an accessor for it` (`:138`)
- `#class_options > sets default options overwriting superclass definitions` (`:144`)
- `#remove_argument > removes previously defined arguments from class` (`:151`)
- `#remove_argument > undefine accessors if required` (`:155`)
- `#remove_class_option > removes previous defined class option` (`:162`)
- `#class_options_help > shows option's description` (`:172`)
- `#class_options_help > shows usage with banner content` (`:176`)
- `#class_options_help > shows default values below descriptions` (`:180`)
- `#class_options_help > prints arrays as copy pasteables` (`:184`)
- `#class_options_help > shows options in different groups` (`:188`)
- `#class_options_help > use padding in options that do not have aliases` (`:194`)
- `#class_options_help > allows extra options to be given` (`:200`)
- `#class_options_help > displays choices for enums` (`:208`)
- `#namespace > returns the default class namespace` (`:215`)
- `#namespace > sets a namespace to the class` (`:219`)
- `#group > sets a group` (`:225`)
- `#group > inherits the group from parent` (`:229`)
- `#group > defaults to standard if no group is given` (`:233`)
- `#subclasses > tracks its subclasses in an Array` (`:239`)
- `#commands > returns a list with all commands defined in this class` (`:264`)
- `#commands > raises an error if a command with reserved word is defined` (`:269`)
- `#all_commands > returns a list with all commands defined in this class plus superclasses` (`:278`)
- `#remove_command > removes the command from its commands hash` (`:285`)
- `#remove_command > undefines the method if desired` (`:290`)
- `#from_superclass > does not send a method to the superclass if the superclass does not respond to it` (`:296`)
- `#start > raises an error instead of rescuing if THOR_DEBUG=1 is given` (`:302`)
- `#start > raises an error instead of rescuing if :debug option is given` (`:314`)
- `#start > suggests commands that are similar if there is a typo` (`:320`)
- `#start > does not steal args` (`:327`)
- `#start > checks unknown options` (`:333`)
- `#start > checks unknown options except specified` (`:339`)
- `attr_* > does not add attr_reader as a command` (`:347`)
- `attr_* > does not add attr_writer as a command` (`:351`)
- `attr_* > does not add attr_accessor as a command` (`:355`)
