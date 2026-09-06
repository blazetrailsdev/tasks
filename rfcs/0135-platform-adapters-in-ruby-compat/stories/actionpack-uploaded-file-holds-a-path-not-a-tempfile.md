---
title: "ActionDispatch::Http::UploadedFile holds a path string where upload.rb:31 holds a Tempfile"
status: done
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 40
pr: 7573
claim: "2026-09-06T19:04:29Z"
assignee: "actionpack-uploaded-file-holds-a-path-not-a-tempfile"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::UploadedFile` holds a `Tempfile`:

```ruby
@tempfile = hash[:tempfile]
raise(ArgumentError, ":tempfile is required") unless @tempfile
```

(`vendor/rails/actionpack/lib/action_dispatch/http/upload.rb:31-33`), and every
member is a one-line delegation to it — `read` is `@tempfile.read(length, buffer)`
(`upload.rb:62-64`), `open` is `@tempfile.open` (`:67-69`), `close` is
`@tempfile.close(unlink_now)` (`:72-74`), `path`/`to_path`/`rewind`/`size`/`eof?`/
`to_io` likewise (`:77-104`). The Tempfile's own descriptor carries the read
position, so a partial read followed by another read continues where it left
off with no bookkeeping in `UploadedFile` at all.

trails' `packages/actionpack/src/action-dispatch/http/upload.ts` instead holds
`_tempfile: string | null` (a PATH) and `_content: Buffer | null`, and accepts
`content:` as an alternative to `tempfile:` where Rails raises `ArgumentError`
without one. #7473 gave `read` Rails' `(length, buffer)` parameters and made
`rewind` real, but it had to buy the read position with a private `_pos` field
and re-open the file on every read:

```ts
const string = File.open(this._tempfile, "rb", (file) => {
  file.seek(this._pos);
  return file.read(length, buffer);
});
```

That, and the invented `readAsString`, `tempfilePath`, `empty`, `valid`,
`isEof`, `write` and `toString` members around it, all exist because the field
is a path rather than a stream.

## Converged shape

`@tempfile` is a `Tempfile` (`@blazetrails/ruby-compat`), which #7473 already
made a real delegating stream, and `initialize` raises `ArgumentError`
(":tempfile is required") when the hash carries none — `upload.rb:31-33`. Every
member collapses to its Rails one-liner: `read` is `this.tempfile.read(length,
buffer)`, `rewind` is `this.tempfile.rewind()`, `size` is `this.tempfile.size`,
and `_pos`, `_content`, the seek, and the invented convenience members go with
them.

The constructors that feed it move over too — `test-process.ts:48`
(`fixture_file_upload`) and `param-builder.ts:68` currently pass a path string
or a Rack params hash.

## Acceptance criteria

- `UploadedFile` holds a `Tempfile`; `_tempfile: string`, `_content` and `_pos`
  are gone, and a hash with no `tempfile:` raises `ArgumentError`
  (`upload.rb:32`).
- `read`, `rewind`, `open`, `close`, `path`, `toPath`, `size`, `isEof` and
  `toIo` are each the single delegation `upload.rb:62-104` spells.
- `packages/actionpack/src/action-dispatch/dispatch/uploaded-file.test.ts` and
  `.trails.test.ts`, `test-process.test.ts` and `action-controller/test-case.test.ts`
  stay green.
