---
title: "Port parser/options_spec.rb, part 1 (to_switches and the first half of #parse)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-options-parser"]
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RSpec port of `vendor/thor/v1.3.2/spec/parser/options_spec.rb` (lines 1–300).

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

## Cases to port (46)

`vendor/thor/v1.3.2/spec/parser/options_spec.rb`:

- `#to_switches > turns true values into a flag` (`:29`)
- `#to_switches > ignores nil` (`:33`)
- `#to_switches > ignores false` (`:37`)
- `#to_switches > avoids extra spaces` (`:41`)
- `#to_switches > writes --name value for anything else` (`:45`)
- `#to_switches > joins several values` (`:49`)
- `#to_switches > accepts arrays` (`:54`)
- `#to_switches > accepts hashes` (`:58`)
- `#to_switches > accepts underscored options` (`:62`)
- `#parse > allows multiple aliases for a given switch` (`:68`)
- `#parse > allows custom short names` (`:75`)
- `#parse > allows custom short-name aliases` (`:80`)
- `#parse > accepts conjoined short switches` (`:85`)
- `#parse > accepts conjoined short switches with input` (`:93`)
- `#parse > returns the default value if none is provided` (`:101`)
- `#parse > returns the default value from defaults hash to required arguments` (`:106`)
- `#parse > gives higher priority to defaults given in the hash` (`:111`)
- `#parse > raises an error for unknown switches` (`:116`)
- `#parse > skips leading non-switches` (`:128`)
- `#parse > correctly recognizes things that look kind of like options, but aren't, as not options` (`:134`)
- `#parse > accepts underscores in commandline args hash for boolean` (`:140`)
- `#parse > accepts underscores in commandline args hash for strings` (`:146`)
- `#parse > interprets everything after -- as args instead of options` (`:152`)
- `#parse > ignores -- when looking for single option values` (`:158`)
- `#parse > ignores -- when looking for array option values` (`:164`)
- `#parse > ignores -- when looking for hash option values` (`:170`)
- `#parse > ignores trailing --` (`:176`)
- `#parse > with no input > and no switches returns an empty hash` (`:183`)
- `#parse > with no input > and several switches returns an empty hash` (`:188`)
- `#parse > with no input > and a required switch raises an error` (`:193`)
- `#parse > with one required and one optional switch > raises an error if the required switch has no argument` (`:204`)
- `#parse > with one required and one optional switch > raises an error if the required switch isn't given` (`:208`)
- `#parse > with one required and one optional switch > raises an error if the required switch is set to nil` (`:212`)
- `#parse > with one required and one optional switch > does not raises an error if the required option has a default value` (`:216`)
- `#parse > stops parsing on first non-option` (`:228`)
- `#parse > stops parsing on unknown option` (`:233`)
- `#parse > retains -- after it has stopped parsing` (`:238`)
- `#parse > still accepts options that are given before non-options` (`:243`)
- `#parse > still accepts options that require a value` (`:248`)
- `#parse > still interprets everything after -- as args instead of options` (`:253`)
- `#parse > raises an error if exclusive argumets are given` (`:265`)
- `#parse > does not raise an error if exclusive argumets are not given` (`:269`)
- `#parse > raises an error if at least one of required argumet is not given` (`:280`)
- `#parse > does not raise an error if at least one of required argument is given` (`:284`)
- `#parse > raises an error if exclusive argumets are given` (`:295`)
- `#parse > does not raise an error if exclusive argumets are not given` (`:299`)
