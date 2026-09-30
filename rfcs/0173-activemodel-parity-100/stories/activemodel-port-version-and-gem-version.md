---
title: "activemodel: un-exclude version.rb — port ActiveModel.version / gem_version"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: api-surface
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`version.rb` is activemodel's only excluded file (`pnpm parity:api` "excluded file 1"), through the
unscoped `/version.rb` entry in `scripts/parity/unported-files/unscoped.ts`, whose reason is that
`Module.version` returns a `Gem::Version`. trails already carries `packages/activemodel/src/gem-version.ts`
(with a PERMANENT receipt audited by `activemodel-audit-permanent-receipts-root`). `version.rb`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/version.rb`) is `def self.version; gem_version; end`. Nothing about it is a language shortcoming:
ruby-compat's `Gem::Version` port is what the `gem_version.rb` side already needs.

`activerecord-port-version-and-gem-version` does the same for activerecord; the unscoped entry can
only be deleted once both land (other gems also match it — narrow it with `package:` rather than
deleting it if they are not ported yet).

## Acceptance criteria

- [ ] `ActiveModel.version` is ported in the file mirroring `version.rb`, returning the same `Gem::Version` `gem_version` returns.
- [ ] The `/version.rb` unported entry no longer matches activemodel (scoped away or deleted); `pnpm parity:api` activemodel `excluded file 0`, matched +1.
