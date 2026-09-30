---
title: "Port thor_spec.rb, part 1 (method_option, default_command, stop_on_unknown_option!, check_unknown_options!, disable_required_check!, map, desc, method_options)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-class-dsl",
    "port-thor-dispatch-and-help",
    "port-thor-spec-helper-and-script-fixtures",
  ]
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

The RSpec port of `vendor/thor/v1.3.2/spec/thor_spec.rb` (lines 1–457).

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

## Cases to port (63)

`vendor/thor/v1.3.2/spec/thor_spec.rb`:

- `#method_option > sets options to the next method to be invoked` (`:5`)
- `#method_option > :lazy_default > is absent when option is not specified` (`:12`)
- `#method_option > :lazy_default > sets a default that can be overridden for strings` (`:17`)
- `#method_option > :lazy_default > sets a default that can be overridden for numerics` (`:25`)
- `#method_option > :lazy_default > sets a default that can be overridden for arrays` (`:33`)
- `#method_option > :lazy_default > sets a default that can be overridden for hashes` (`:41`)
- `#method_option > when :for is supplied > updates an already defined command` (`:51`)
- `#method_option > when :for is supplied > and the target is on the parent class > updates an already defined command` (`:57`)
- `#method_option > when :for is supplied > and the target is on the parent class > adds a command to the command list if the updated command is on the parent class` (`:63`)
- `#method_option > when :for is supplied > and the target is on the parent class > clones the parent command` (`:67`)
- `#default_command > sets a default command` (`:75`)
- `#default_command > invokes the default command if no command is specified` (`:79`)
- `#default_command > invokes the default command if no command is specified even if switches are given` (`:83`)
- `#default_command > inherits the default command from parent` (`:87`)
- `#stop_on_unknown_option! > passes remaining args to command when it encounters a non-option` (`:110`)
- `#stop_on_unknown_option! > passes remaining args to command when it encounters an unknown option` (`:114`)
- `#stop_on_unknown_option! > still accepts options that are given before non-options` (`:118`)
- `#stop_on_unknown_option! > still accepts options that require a value` (`:122`)
- `#stop_on_unknown_option! > still passes everything after -- to command` (`:126`)
- `#stop_on_unknown_option! > still passes everything after -- to command, complex` (`:130`)
- `#stop_on_unknown_option! > does not affect ordinary commands` (`:134`)
- `#stop_on_unknown_option! > affects all specified commands` (`:142`)
- `#stop_on_unknown_option! > affects all specified commands` (`:154`)
- `#stop_on_unknown_option! > doesn't break new` (`:161`)
- `#stop_on_unknown_option! > passes remaining args to command when it encounters a non-option` (`:182`)
- `#stop_on_unknown_option! > does not accept if first non-option looks like an option, but only refuses that invalid option` (`:186`)
- `#stop_on_unknown_option! > still accepts options that are given before non-options` (`:192`)
- `#stop_on_unknown_option! > still accepts when non-options are given after real options and argument` (`:196`)
- `#stop_on_unknown_option! > does not accept when non-option looks like an option and is after real options` (`:200`)
- `#stop_on_unknown_option! > still accepts options that require a value` (`:206`)
- `#stop_on_unknown_option! > still passes everything after -- to command` (`:210`)
- `#stop_on_unknown_option! > still passes everything after -- to command, complex` (`:214`)
- `#check_unknown_options! > still accept options and arguments` (`:236`)
- `#check_unknown_options! > still accepts options that are given before arguments` (`:240`)
- `#check_unknown_options! > does not accept if non-option that looks like an option is before the arguments` (`:244`)
- `#check_unknown_options! > does not accept if non-option that looks like an option is after an argument` (`:250`)
- `#check_unknown_options! > does not accept when non-option that looks like an option is after real options` (`:256`)
- `#check_unknown_options! > does not accept when non-option that looks like an option is before real options` (`:262`)
- `#check_unknown_options! > still accepts options that require a value` (`:268`)
- `#check_unknown_options! > still passes everything after -- to command` (`:272`)
- `#check_unknown_options! > still passes everything after -- to command, complex` (`:276`)
- `#disable_required_check! > does not check the required option in the given command` (`:302`)
- `#disable_required_check! > does check the required option of the remaining command` (`:306`)
- `#disable_required_check! > does affects help by default` (`:311`)
- `#disable_required_check! > affects all specified commands` (`:320`)
- `#disable_required_check! > affects all specified commands` (`:334`)
- `#command_exists? > returns true for a command that is defined in the class` (`:344`)
- `#command_exists? > returns false for a command that is not defined in the class` (`:350`)
- `#map > calls the alias of a method if one is provided` (`:356`)
- `#map > calls the alias of a method if several are provided via #map` (`:360`)
- `#map > inherits all mappings from parent` (`:365`)
- `#package_name > provides a proper description for a command when the package_name is assigned` (`:371`)
- `#package_name > provides a proper description for a command when the package_name is NOT assigned` (`:377`)
- `#desc > provides description for a command` (`:384`)
- `#desc > provides no namespace if $thor_runner is false` (`:389`)
- `#desc > when :for is supplied > overwrites a previous defined command` (`:400`)
- `#desc > when :hide is supplied > does not show the command in help` (`:406`)
- `#desc > when :hide is supplied > but the command is still invocable, does not show the command in help` (`:410`)
- `#method_options > sets default options if called before an initializer` (`:417`)
- `#method_options > overwrites default options if called on the method scope` (`:423`)
- `#method_options > allows default options to be merged with method options` (`:429`)
- `#method_exclusive > returns the exclusive option names for the class` (`:438`)
- `#method_at_least_one > returns the at least one of option names for the class` (`:448`)
