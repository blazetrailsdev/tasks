---
title: "generators-read-app-files-relative-to-the-working-directory"
status: draft
updated: 2026-10-27
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails generators read app files relative to the process working directory, which a
generator run has at the app root: `File.exist?(content_path)`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/credentials/credentials_generator.rb:16`),
`File.exist?(file_path)` (`encrypted_file/encrypted_file_generator.rb:10`),
`File.exist? system_test_case_path` (`devcontainer/devcontainer_generator.rb:49`),
`File.exist?(path)` / `File.exist?(dockerfile_path)` / `File.read(devcontainer_json_path)`
(`db/system/change/change_generator.rb:22,49,122,184-186`), `File.read("Gemfile")`
(`authentication/authentication_generator.rb:42`).

trails' ports prefix each with `File.join(this.destinationRoot, …)` (formerly the deleted
`GeneratorBase#fileExists`): `packages/trailties/src/generators/rails/{authentication,credentials,db/system/change,devcontainer,encrypted-file}/*-generator.ts`.
Making the paths bare reds 27 tests (authentication, credentials, db change, devcontainer),
which construct generators with `cwd: tmpDir` and never chdir. The encryption-key-file and
master-key generators already converged (trails#9391): their tests `Dir.chdir(tmpDir)` in
`beforeEach` and restore in `afterEach`.

## Acceptance criteria

- [ ] Each listed call passes Rails' bare path; no `File.join(this.destinationRoot, …)` remains
      where Rails reads a relative path.
- [ ] Their tests run inside the destination (`Dir.chdir` in `beforeEach`/`afterEach`), as the
      key-file generator tests do.
- [ ] `parity:api:calls:args` green with no new rows.
