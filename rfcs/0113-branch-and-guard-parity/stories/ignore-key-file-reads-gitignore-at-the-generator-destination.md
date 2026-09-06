---
title: "ignore_key_file reads and appends to the SAME .gitignore, resolved against the destination"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::EncryptionKeyFileGenerator#ignore_key_file`
(`railties/lib/rails/generators/rails/encryption_key_file/encryption_key_file_generator.rb:32-45`)
reads `.gitignore` by its bare relative name, so it resolves against the
generator's destination the way `append_to_file ".gitignore"` on the next line
does:

```ruby
def ignore_key_file(key_path, ignore: key_ignore(key_path))
  if File.exist?(".gitignore")
    unless File.read(".gitignore").include?(ignore)
      log "Ignoring #{key_path} so it won't end up in Git history:"
      ...
```

`packages/trailties/src/generators/rails/encryption-key-file/encryption-key-file-generator.ts:31-40`
reads `File.join(this.cwd, ".gitignore")` instead — the port has no per-generator
chdir, so the bare name would resolve against the process cwd rather than the
destination. PR #7462 baselined the call-argument row
(`trailties/generators/rails/encryption-key-file/encryption-key-file-generator.json`,
`read(str:.gitignore)`) when `File` left `CORE_CLASS_RECEIVERS`.

Note the two halves already disagree: the read is `cwd`-joined but the
`appendToFile(".gitignore", ignore)` beside it passes the bare name, so the
generator can test one file and append to another whenever `cwd` is not the
destination root. That is the bug under the baseline row, not just a spelling
difference.

Rails' `log ignore, :on_green` and the trailing `log ""` calls are also dropped
in the port's single `output(...)` line — same method, worth converging together.

## Acceptance criteria

- The generator resolves relative paths against its destination the way Thor's
  `destination_root` does, so `File.exist?(".gitignore")`,
  `File.read(".gitignore")` and `append_to_file ".gitignore"` all name the same
  file, spelled as Rails spells them.
- `ignore_key_file` and `ignore_key_file_silently` keep Rails' branch order and
  its `log` calls, including the `:on_green` colour argument and the blank-line
  `log ""` calls.
- The `read(str:.gitignore)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/trailties/generators/rails/encryption-key-file/encryption-key-file-generator.json`
  (only-shrink: delete by hand, no reseed) and `pnpm parity:api:calls:args` is green.
- A test covers the case the current split hides: a destination root that is not
  the process cwd, where the read and the append must agree.
