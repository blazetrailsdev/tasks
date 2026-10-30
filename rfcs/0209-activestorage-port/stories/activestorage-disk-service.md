---
title: "Port Service::DiskService with the shared service tests"
status: done
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: as-services
packages: ["activestorage"]
deps: ["activestorage-service-registry-and-configurator"]
deps-rfc: []
est-loc: 550
priority: null
pr: trails#9468
claim: "2026-10-29T23:46:22Z"
assignee: "activestorage-disk-service"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/disk_service.rb` (178): `initialize(root:,
public:)` (`:16`), `upload` with `ensure_integrity_of` (`:21-26`, `:163-168`),
`download` streaming in chunks (`:28-40`, `stream` `:145-153`),
`download_chunk` (`:42-51`), `delete` / `delete_prefixed` (`:53-67`),
`exist?`, `url_for_direct_upload` / `headers_for_direct_upload` (`:77-99`),
`path_for` / `folder_for` / `make_path_for` (`:101`, `:155-161`), `compose`
(`:105-113`), and `generate_url` over `ActiveStorage.verifier` and the
`rails_disk_service` url helper (`:124-143`, `:170-177`). Tests:
`test/service/shared_service_tests.rb` (14), `disk_service_test.rb` (8),
`disk_public_service_test.rb` (1).

## Acceptance criteria

- `DiskService` is ported with every I/O method async over ruby-compat
  `File` / `FileUtils` / `Dir`; `download` with a block yields chunks as
  Rails' `stream` does; an integrity failure raises `IntegrityError`.
- `generate_url` signs with `ActiveStorage.verifier` and builds the
  `rails_disk_service` URL; until the routes story lands the test helper
  supplies `url_options` as Rails' test does.
- The shared service tests and both disk test files pass.
