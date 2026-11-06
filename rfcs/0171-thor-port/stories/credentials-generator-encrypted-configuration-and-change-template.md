---
title: "CredentialsGenerator renders through EncryptedConfiguration#change and template"
status: ready
updated: 2026-11-06
rfc: "0171-thor-port"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::CredentialsGenerator#encrypted_file`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/credentials/credentials_generator.rb:33-39`) builds an
`ActiveSupport::EncryptedConfiguration` from `config_path` and `key_path`. `render_template_to_encrypted_file`
(`:45-57`) runs `empty_directory File.dirname(content_path)`, then
`encrypted_file.change { |tmp_path| template("credentials.yml", tmp_path, force: true, verbose: false) { |rendered| content = rendered } }`.

trails' `credentials-generator.ts` builds an `EncryptedFile` (not `EncryptedConfiguration`). It calls `FileUtils.mkdirP`
inside `encryptedFile()` instead of `empty_directory`, and `renderTemplate` renders a string and calls `.write(content)`
instead of going through `change` + `template`.

## Acceptance criteria

- `encryptedFile` returns `new EncryptedConfiguration({ configPath: this.contentPath, keyPath: this.keyPath, envKey: "TRAILS_MASTER_KEY", raiseIfMissingKey: true })`.
- `renderTemplateToEncryptedFile` mirrors Rails: `emptyDirectory(File.dirname(contentPath))`, then `change` with `template(..., tmpPath, { force: true, verbose: false })` capturing the rendered content.
- `FileUtils.mkdirP` is removed from `encryptedFile`.
