---
title: "key-read-receiver-unread-port-body-rows-converge"
status: in-progress
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8947
claim: "2026-10-15T18:30:59Z"
assignee: "key-read-receiver-unread-port-body-rows-converge"
blocked-by: null
closed-reason: null
---

## Context

`key-read-receiver-unread-structural-rows-converge` took `pnpm parity:api:key-reads`
(`scripts/api-compare/report-key-reads.ts`) from 43 to 16 `receiver-unread` rows. The
ones left are each a port whose body is not Rails' body, not a report gap:

- `trailties/generators/actions.ts#generate` stubs `generate` into `pendingGenerators`;
  Rails is `generators/actions.rb:332-339` (`options = args.extract_options!`,
  `options[:abort_on_failure] = !options[:inline]`, `rails_command ...`).
- `trailties/generators/rails/controller/controller-generator.ts#addRoutes` takes
  `(namespaceParts, actions, skipRoutes)`; Rails' `add_routes` is zero-arg and reads
  `options[:skip_routes]` (`rails/controller/controller_generator.rb:17-22`).
- `trailties/generators/rails/db/system/change/change-generator.ts#constructor` /
  `#database` (`change_generator.rb`, `opt[:to]`, `options[:database]`).
- `trailties/generators/rails/devcontainer/devcontainer-generator.ts#dependencies` /
  `#volumes` (`devcontainer_generator.rb`, `options[:system_test]`, `options[:redis]`).
- `globalid/uri/gid.ts#build`: Rails builds `parts` via `Util.make_components_hash`
  (`global_id/uri/gid.rb:90-101`); the port reads `args`.
- `pg/connection.ts#conndefaultsHash` (`info[:keyword]`, `info[:val]`) and `#reset`
  (`iopts[:host]`), vendored pg gem `connection.rb`.
- `actionview/routing-url-for.ts#ensureOnlyPathOption` splits a `Parameters` arm from a
  hash arm with different key spellings; Rails' body is uniform
  (`routing_url_for.rb:143-147`).
- `actiondispatch/system-testing/driver.ts#constructor` (key-unread `@options[:browser]`):
  the selenium arm of `system_testing/driver.rb:17-22` is unported.

## Acceptance criteria

- [ ] Each body above is rewritten to the Rails body (names, receivers, control flow).
- [ ] `pnpm parity:api:key-reads` lists none of these rows.
