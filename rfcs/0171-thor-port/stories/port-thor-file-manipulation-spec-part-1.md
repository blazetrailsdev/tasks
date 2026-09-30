---
title: "Port actions/file_manipulation_spec.rb, part 1 (chmod, copy_file, link_file, get, template)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "thor-actions-template-is-unported",
    "port-thor-file-manipulation-edits",
    "port-thor-spec-group-and-invoke-fixtures",
  ]
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

The RSpec port of `vendor/thor/v1.3.2/spec/actions/file_manipulation_spec.rb` (lines 1–263).

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

## Cases to port (33)

`vendor/thor/v1.3.2/spec/actions/file_manipulation_spec.rb`:

- `#chmod > executes the command given` (`:29`)
- `#chmod > does not execute the command if pretending` (`:34`)
- `#chmod > logs status` (`:40`)
- `#chmod > does not log status if required` (`:45`)
- `#copy_file > copies file from source to default destination` (`:52`)
- `#copy_file > copies file from source to the specified destination` (`:57`)
- `#copy_file > copies file from the source relative to the current path` (`:62`)
- `#copy_file > copies file from source to default destination and preserves file mode` (`:69`)
- `#copy_file > copies file from source to default destination and preserves file mode for templated filenames` (`:76`)
- `#copy_file > logs status` (`:84`)
- `#copy_file > accepts a block to change output` (`:88`)
- `#link_file > links file from source to default destination` (`:97`)
- `#link_file > links file from source to the specified destination` (`:102`)
- `#link_file > links file from the source relative to the current path` (`:107`)
- `#link_file > logs status` (`:114`)
- `#get > copies file from source to the specified destination` (`:120`)
- `#get > uses just the source basename as destination if none is specified` (`:125`)
- `#get > allows the destination to be set as a block result` (`:130`)
- `#get > yields file content to a block` (`:135`)
- `#get > logs status` (`:141`)
- `#get > accepts http remote sources` (`:145`)
- `#get > accepts https remote sources` (`:154`)
- `#get > accepts http headers` (`:163`)
- `#template > allows using block helpers in the template` (`:175`)
- `#template > evaluates the template given as source` (`:182`)
- `#template > copies the template to the specified destination` (`:190`)
- `#template > converts encoded instructions` (`:197`)
- `#template > accepts filename without .tt for template method` (`:204`)
- `#template > logs status` (`:211`)
- `#template > accepts a block to change output` (`:216`)
- `#template > accepts a context to use as the binding` (`:224`)
- `#template > guesses the destination name when given only a source` (`:234`)
- `#template > has proper ERB stacktraces` (`:241`)
