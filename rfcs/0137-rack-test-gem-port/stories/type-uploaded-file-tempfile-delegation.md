---
title: "Type Rack::Test::UploadedFile's tempfile delegation so build_file_part drops its casts"
status: in-progress
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 17
pr: 7529
claim: "2026-09-05T17:58:56Z"
assignee: "port-rack-test-methods"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Test::UploadedFile` forwards what it does not define to `@tempfile`
through `method_missing` / `respond_to_missing?`
(`vendor/rack-test/lib/rack/test/uploaded_file.rb:52-58`). trails' port spells
that with `methodMissingProxy`
(`packages/rack-test/src/uploaded-file.ts`, its constructor's
`return methodMissingProxy(this, { delegate: (uploadedFile) => uploadedFile.tempfile })`),
which is correct at runtime but invisible to the type — the class declares only
`originalFilename`, `tempfile`, `contentType`, `path`, `localPath` and
`appendTo`.

So every delegated read needs a cast. `build_file_part`
(`vendor/rack-test/lib/rack/test/utils.rb:133-155`) is two plain sends in Ruby:

```ruby
uploaded_file.size.to_s
uploaded_file.set_encoding(Encoding::BINARY)
```

and in `packages/rack-test/src/utils.ts`'s `buildFilePart` they are:

```ts
b(String((uploadedFile as unknown as { size: number }).size))(
  uploadedFile as unknown as { setEncoding(enc: Encoding): void },
).setEncoding(Encoding.BINARY);
```

The casts sit at exactly the line-for-line call sites the fidelity bar is
measured on, and every future consumer of `UploadedFile` (`port-rack-test-session`'s
upload cases, `converge-file-fixture-upload-onto-rack-test-uploaded-file`)
will need the same ones.

Converged shape: declare the delegated surface on `UploadedFile` so the sends
type-check as written — the trails idiom is a merged `interface UploadedFile`
carrying the `Tempfile | StringIO` members the proxy actually answers (`size`,
`pos`, `read`, `rewind`, `setEncoding`, `binmode`, `isEof`, `readpartial`,
`close`), which is what `respond_to_missing?` promises on the Ruby side. Keep
it to the members the proxy really forwards; a member neither delegate defines
must stay absent, because `methodMissingProxy`'s `has` trap answers `false` for
it and Ruby's `respond_to?` does too.

`Tempfile#size` and `IO#pos` / `StringIO#pos` landed in #7496 and already exist.

## Acceptance criteria

- [ ] `uploadedFile.size` and `uploadedFile.setEncoding(...)` in
      `buildFilePart` are written as Ruby writes them, with no `as unknown as`.
- [ ] The declared delegated members are exactly those `Tempfile` / `StringIO`
      answer, so the type matches what `methodMissingProxy`'s `has` trap does.
- [ ] No new public surface on `UploadedFile` beyond what Ruby's delegation
      already answers — `pnpm parity:api:extra --package rack-test` does not grow.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates green.
