---
title: "Port actions/file_manipulation_spec.rb, part 2 (when changing existent files, when adjusting comments)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-file-manipulation-edits", "port-thor-spec-group-and-invoke-fixtures"]
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

The RSpec port of `vendor/thor/v1.3.2/spec/actions/file_manipulation_spec.rb` (lines 264–9999).

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

`vendor/thor/v1.3.2/spec/actions/file_manipulation_spec.rb`:

- `when changing existent files > #remove_file > removes the file given` (`:264`)
- `when changing existent files > #remove_file > removes broken symlinks too` (`:269`)
- `when changing existent files > #remove_file > removes directories too` (`:276`)
- `when changing existent files > #remove_file > does not remove if pretending` (`:281`)
- `when changing existent files > #remove_file > logs status` (`:287`)
- `when changing existent files > #remove_file > does not log status if required` (`:291`)
- `when changing existent files > #gsub_file > replaces the content in the file` (`:298`)
- `when changing existent files > #gsub_file > does not replace if pretending` (`:303`)
- `when changing existent files > #gsub_file > accepts a block` (`:309`)
- `when changing existent files > #gsub_file > logs status` (`:314`)
- `when changing existent files > #gsub_file > does not log status if required` (`:318`)
- `when changing existent files > #gsub_file > does not replace the content in the file` (`:325`)
- `when changing existent files > #gsub_file > does not replace if pretending` (`:331`)
- `when changing existent files > #gsub_file > does not replace the content in the file when given a block` (`:337`)
- `when changing existent files > #gsub_file > does not log status` (`:343`)
- `when changing existent files > #gsub_file > does not log status if required` (`:348`)
- `when changing existent files > #gsub_file > replaces the content in the file` (`:355`)
- `when changing existent files > #gsub_file > does not replace if pretending` (`:361`)
- `when changing existent files > #gsub_file > replaces the content in the file when given a block` (`:367`)
- `when changing existent files > #gsub_file > logs status` (`:373`)
- `when changing existent files > #gsub_file > does not log status if required` (`:378`)
- `when changing existent files > #append_to_file > appends content to the file` (`:387`)
- `when changing existent files > #append_to_file > accepts a block` (`:392`)
- `when changing existent files > #append_to_file > logs status` (`:397`)
- `when changing existent files > #prepend_to_file > prepends content to the file` (`:403`)
- `when changing existent files > #prepend_to_file > accepts a block` (`:408`)
- `when changing existent files > #prepend_to_file > logs status` (`:413`)
- `when changing existent files > #inject_into_class > appends content to a class` (`:423`)
- `when changing existent files > #inject_into_class > accepts a block` (`:428`)
- `when changing existent files > #inject_into_class > logs status` (`:433`)
- `when changing existent files > #inject_into_class > does not append if class name does not match` (`:437`)
- `when changing existent files > #inject_into_module > appends content to a module` (`:448`)
- `when changing existent files > #inject_into_module > accepts a block` (`:453`)
- `when changing existent files > #inject_into_module > logs status` (`:458`)
- `when changing existent files > #inject_into_module > does not append if module name does not match` (`:462`)
- `when adjusting comments > #uncomment_lines > uncomments all matching lines in the file` (`:481`)
- `when adjusting comments > #uncomment_lines > correctly uncomments lines with hashes in them` (`:489`)
- `when adjusting comments > #uncomment_lines > will leave the space which existed before the comment hash in tact` (`:494`)
- `when adjusting comments > #uncomment_lines > does not modify already uncommented lines in the file` (`:500`)
- `when adjusting comments > #uncomment_lines > does not uncomment the wrong line when uncommenting lines preceded by blank commented line` (`:506`)
- `when adjusting comments > #comment_lines > comments lines which are not commented` (`:513`)
- `when adjusting comments > #comment_lines > correctly comments lines with hashes in them` (`:521`)
- `when adjusting comments > #comment_lines > does not modify already commented lines` (`:526`)
