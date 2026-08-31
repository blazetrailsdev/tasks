---
title: "port-template-sources-file-for-lazy-resolver-sources"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionView::Template::Sources::File`
(`vendor/rails/actionview/lib/action_view/template/sources/file.rb`) is
unported — `packages/actionview/src/template/sources/file.ts` scores 0/2 in
`pnpm parity:api --package actionview`.

Rails' `Resolver#source_for_template`
(`vendor/rails/actionview/lib/action_view/template/resolver.rb:141-143`) is
`Template::Sources::File.new(template)`: a lazy source that reads the file only
when `to_s` is called, so a resolver can enumerate candidates without touching
disk for the ones the details cascade discards. `FileSystemResolver`
(`packages/actionview/src/template/resolver.ts`) returns the file's contents
eagerly instead, and carries a `@missingRailsCall Template::Sources::File.new`
receipt at that call site.

`FixtureResolver#source_for_template` (`testing/resolvers.rb:31-33`) returns the
hash entry directly and needs no Source, so only the FileSystemResolver arm is
affected.

## Acceptance criteria

- `Template::Sources::File` is ported to
  `packages/actionview/src/template/sources/file.ts` with Rails' lazy `to_s`.
- `Resolver#sourceForTemplate` returns it, and `Template` accepts it where it
  accepts a source string today.
- The `@missingRailsCall Template::Sources::File.new` receipt in
  `template/resolver.ts` is deleted.
