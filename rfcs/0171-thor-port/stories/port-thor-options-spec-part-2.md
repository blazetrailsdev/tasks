---
title: "Port parser/options_spec.rb, part 2 (the rest of #parse: repeatable, hash, array, numeric, enum, exclusive, at-least-one)"
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

The RSpec port of `vendor/thor/v1.3.2/spec/parser/options_spec.rb` (lines 301–9999).

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

## Cases to port (43)

`vendor/thor/v1.3.2/spec/parser/options_spec.rb`:

- `#parse > raises an error if at least one of required argumet is not given` (`:310`)
- `#parse > does not raise an error if at least one of required argument is given` (`:314`)
- `#parse > with :string type > accepts a switch <value> assignment` (`:324`)
- `#parse > with :string type > accepts a switch=<value> assignment` (`:328`)
- `#parse > with :string type > must accept underscores switch=value assignment` (`:336`)
- `#parse > with :string type > accepts a --no-switch format` (`:341`)
- `#parse > with :string type > does not consume an argument for --no-switch format` (`:346`)
- `#parse > with :string type > accepts a --switch format on non required types` (`:351`)
- `#parse > with :string type > accepts a --switch format on non required types with default values` (`:356`)
- `#parse > with :string type > overwrites earlier values with later values` (`:361`)
- `#parse > with :string type > raises error when value isn't in enum` (`:366`)
- `#parse > with :string type > does not erroneously mutate defaults` (`:373`)
- `#parse > with :boolean type > accepts --opt assignment` (`:385`)
- `#parse > with :boolean type > uses the default value if no switch is given` (`:390`)
- `#parse > with :boolean type > accepts --opt=value assignment` (`:394`)
- `#parse > with :boolean type > accepts --[no-]opt variant, setting false for value` (`:399`)
- `#parse > with :boolean type > accepts --[skip-]opt variant, setting false for value` (`:403`)
- `#parse > with :boolean type > accepts --[skip-]opt variant, setting false for value, even if there's a trailing non-switch` (`:407`)
- `#parse > with :boolean type > will prefer 'no-opt' variant over inverting 'opt' if explicitly set` (`:411`)
- `#parse > with :boolean type > will prefer 'skip-opt' variant over inverting 'opt' if explicitly set` (`:416`)
- `#parse > with :boolean type > will prefer 'skip-opt' variant over inverting 'opt' if explicitly set, even if there's a trailing non-switch` (`:421`)
- `#parse > with :boolean type > will prefer 'skip-opt' variant over inverting 'opt' if explicitly set, and given a value` (`:426`)
- `#parse > with :boolean type > accepts inputs in the human name format` (`:434`)
- `#parse > with :boolean type > doesn't eat the next part of the param` (`:441`)
- `#parse > with :boolean type > doesn't eat the next part of the param with 'no-opt' variant` (`:446`)
- `#parse > with :boolean type > doesn't eat the next part of the param with 'skip-opt' variant` (`:451`)
- `#parse > with :boolean type > allows multiple values if repeatable is specified` (`:456`)
- `#parse > with :hash type > accepts a switch=<value> assignment` (`:467`)
- `#parse > with :hash type > accepts a switch <value> assignment` (`:472`)
- `#parse > with :hash type > must not mix values with other switches` (`:476`)
- `#parse > with :hash type > must not allow the same hash key to be specified multiple times` (`:480`)
- `#parse > with :hash type > allows multiple values if repeatable is specified` (`:484`)
- `#parse > with :array type > accepts a switch=<value> assignment` (`:495`)
- `#parse > with :array type > accepts a switch <value> assignment` (`:500`)
- `#parse > with :array type > must not mix values with other switches` (`:504`)
- `#parse > with :array type > allows multiple values if repeatable is specified` (`:508`)
- `#parse > with :array type > raises error when value isn't in enum` (`:513`)
- `#parse > with :numeric type > accepts a -nXY assignment` (`:526`)
- `#parse > with :numeric type > converts values to numeric types` (`:530`)
- `#parse > with :numeric type > raises error when value isn't numeric` (`:534`)
- `#parse > with :numeric type > raises error when value isn't in Array enum` (`:539`)
- `#parse > with :numeric type > raises error when value isn't in Range enum` (`:546`)
- `#parse > with :numeric type > allows multiple values if repeatable is specified` (`:553`)
