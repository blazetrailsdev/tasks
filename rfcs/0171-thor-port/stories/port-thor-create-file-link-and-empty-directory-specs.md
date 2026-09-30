---
title: "Port actions/create_file_spec.rb, create_link_spec.rb and empty_directory_spec.rb"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-empty-directory-create-file-and-create-link",
    "thor-create-file-conflict-has-no-file-collision-prompt",
    "port-thor-spec-group-and-invoke-fixtures",
  ]
deps-rfc: []
est-loc: 550
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RSpec port of `vendor/thor/v1.3.2/spec/actions/create_file_spec.rb`, `vendor/thor/v1.3.2/spec/actions/create_link_spec.rb`, `vendor/thor/v1.3.2/spec/actions/empty_directory_spec.rb`.

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

## Cases to port (47)

`vendor/thor/v1.3.2/spec/actions/create_file_spec.rb`:

- `#invoke! > creates a file` (`:30`)
- `#invoke! > allows setting file permissions` (`:36`)
- `#invoke! > does not create a file if pretending` (`:44`)
- `#invoke! > shows created status to the user` (`:50`)
- `#invoke! > does not show any information if log status is false` (`:55`)
- `#invoke! > returns the given destination` (`:61`)
- `#invoke! > converts encoded instructions` (`:67`)
- `#invoke! > when file exists > and is identical > shows identical status` (`:80`)
- `#invoke! > when file exists > and is not identical > shows forced status to the user if force is given` (`:92`)
- `#invoke! > when file exists > and is not identical > shows skipped status to the user if skip is given` (`:97`)
- `#invoke! > when file exists > and is not identical > shows forced status to the user if force is configured` (`:102`)
- `#invoke! > when file exists > and is not identical > shows skipped status to the user if skip is configured` (`:107`)
- `#invoke! > when file exists > and is not identical > shows conflict status to the user` (`:112`)
- `#invoke! > when file exists > and is not identical > creates the file if the file collision menu returns true` (`:122`)
- `#invoke! > when file exists > and is not identical > skips the file if the file collision menu returns false` (`:128`)
- `#invoke! > when file exists > and is not identical > executes the block given to show file content` (`:134`)
- `#invoke! > when file exists > and is not identical > executes the block given to run merge tool` (`:141`)
- `#invoke! > generates a file clash` (`:157`)
- `#invoke! > generates a file clash` (`:169`)
- `#revoke! > removes the destination file` (`:177`)
- `#revoke! > does not raise an error if the file does not exist` (`:184`)
- `#exists? > returns true if the destination file exists` (`:192`)
- `#identical? > returns true if the destination file exists and is identical` (`:201`)
- `#identical? > returns true if the destination file exists and is identical and contains multi-byte UTF-8 codepoints` (`:208`)

`vendor/thor/v1.3.2/spec/actions/create_link_spec.rb`:

- `#invoke! > creates a symbolic link` (`:43`)
- `#invoke! > creates a hard link` (`:55`)
- `#invoke! > creates a symbolic link by default` (`:63`)
- `#invoke! > does not create a link` (`:72`)
- `#invoke! > shows created status to the user` (`:78`)
- `#invoke! > does not show any information` (`:84`)
- `#identical? > returns true if the destination link exists and is identical` (`:91`)
- `#identical? > returns true if the destination link exists and is identical` (`:103`)
- `#revoke! > removes the symbolic link of non-existent destination` (`:112`)

`vendor/thor/v1.3.2/spec/actions/empty_directory_spec.rb`:

- `#destination > returns the full destination with the destination_root` (`:26`)
- `#destination > takes relative root into account` (`:30`)
- `#relative_destination > returns the relative destination to the original destination root` (`:38`)
- `#given_destination > returns the destination supplied by the user` (`:46`)
- `#invoke! > copies the file to the specified destination` (`:54`)
- `#invoke! > shows created status to the user` (`:60`)
- `#invoke! > does not create a directory if pretending` (`:65`)
- `#invoke! > when directory exists > shows exist status` (`:73`)
- `#revoke! > removes the destination file` (`:82`)
- `#exists? > returns true if the destination file exists` (`:91`)
- `#convert_encoded_instructions > accepts and executes a 'legal' %\w+% encoded instruction` (`:106`)
- `#convert_encoded_instructions > accepts and executes a private %\w+% encoded instruction` (`:110`)
- `#convert_encoded_instructions > ignores an 'illegal' %\w+% encoded instruction` (`:120`)
- `#convert_encoded_instructions > ignores incorrectly encoded instruction` (`:124`)
