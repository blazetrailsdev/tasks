---
title: "Port register_spec.rb, subcommand_spec.rb and sort_spec.rb"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-spec-part-1", "port-thor-group"]
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

The RSpec port of `vendor/thor/v1.3.2/spec/register_spec.rb`, `vendor/thor/v1.3.2/spec/subcommand_spec.rb`, `vendor/thor/v1.3.2/spec/sort_spec.rb`.

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

## Cases to port (25)

`vendor/thor/v1.3.2/spec/register_spec.rb`:

- `.register-ing a Thor subclass > registers the plugin as a subcommand` (`:153`)
- `.register-ing a Thor subclass > includes the plugin's usage in the help` (`:158`)
- `.register-ing a Thor subclass > invokes the default command correctly` (`:164`)
- `.register-ing a Thor subclass > invokes the default command correctly with multiple args` (`:169`)
- `.register-ing a Thor subclass > invokes the default command correctly with a declared argument` (`:175`)
- `.register-ing a Thor subclass > displays the subcommand's help message` (`:180`)
- `.register-ing a Thor subclass > invokes commands with their actual args` (`:186`)
- `.register-ing a Thor subclass > includes the plugin's subcommand name in subcommand's help` (`:193`)
- `.register-ing a Thor subclass > omits the hidden plugin's usage from the help` (`:205`)
- `.register-ing a Thor subclass > registers the plugin as a subcommand` (`:210`)
- `.register-ing a Thor::Group subclass > registers the group as a single command` (`:218`)
- `.register-ing a Thor::Group subclass with class options > works w/o command options` (`:225`)
- `.register-ing a Thor::Group subclass with class options > works w/command options` (`:230`)

`vendor/thor/v1.3.2/spec/subcommand_spec.rb`:

- `#subcommand > maps a given subcommand to another Thor subclass` (`:5`)
- `#subcommand > passes commands to subcommand classes` (`:10`)
- `#subcommand > passes arguments to subcommand classes` (`:14`)
- `#subcommand > ignores unknown options (the subcommand class will handle them)` (`:18`)
- `#subcommand > passes parsed options to subcommands` (`:22`)
- `#subcommand > accepts the help switch and calls the help command on the subcommand` (`:27`)
- `#subcommand > accepts the help short switch and calls the help command on the subcommand` (`:33`)
- `#subcommand > the help command on the subcommand and after it should result in the same output` (`:39`)
- `shows subcommand name and method name` (`:65`)

`vendor/thor/v1.3.2/spec/sort_spec.rb`:

- `#sort - default > sorts them lexicographillay` (`:21`)
- `#sort - simple override > sorts them in reverse` (`:46`)
- `#sort - simple override > puts help first then sorts them lexicographillay` (`:71`)
