---
title: "Rack::Multipart::UploadedFile's tempfile is an in-memory stand-in, not a Tempfile"
status: draft
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7444 (RFC 0135's rack flip), which had to read the file's bytes
through `File.open(path, "rb")` because the object it feeds is not a Tempfile.

`Rack::Multipart::UploadedFile#initialize`
(`vendor/rack/lib/rack/multipart/uploaded_file.rb:22-27`) builds a REAL
tempfile and copies the source file into it:

```ruby
raise "#{path} file does not exist" unless ::File.exist?(path)
@original_filename = filename || ::File.basename(path)
@tempfile = Tempfile.new([@original_filename, ::File.extname(path)], encoding: Encoding::BINARY)
@tempfile.binmode if binary
FileUtils.copy_file(path, @tempfile.path)
```

`packages/rack/src/multipart/uploaded-file.ts` instead reads the whole file
into a JS string and hands it to a local `makeTempfile(content, path)` — a
hand-rolled object literal with `path`, `read()` and `rewind()` closing over a
cursor. Four things follow, and none of them are Rails:

- **No file is created.** `uf.path` answers the SOURCE path, where Ruby answers
  the tempfile's. A caller that writes through `path` corrupts the original,
  and `Tempfile#unlink` / finalization has nothing to remove.
- **`::File.extname(path)` is unused.** Ruby's tempfile keeps the source
  extension in its own name (`uploaded_file.rb:24`); the stand-in has no name
  to keep it in.
- **`binmode` has nowhere to land.** `uploaded_file.rb:25` toggles it on the
  tempfile; the port stores `binary` on the UploadedFile and the flag now
  changes nothing, since #7444 made the read unconditionally binary.
- **The whole file is resident.** Ruby copies on disk; the port holds every
  uploaded byte in a JS string for the object's lifetime.

trails already has the pieces. `packages/activesupport/src/tempfile.ts` ports
`Tempfile`, and RFC 0129's `move-tempfile-to-ruby-compat` moves it to the leaf
where `rack` can reach it without depending on activesupport — which RFC 0135's
`rack-and-rack-session-drop-the-activesupport-dependency` wants anyway.
`FileUtils` is already a Ruby class in ruby-compat
(`packages/ruby-compat/src/file-utils.ts`), though `copy_file` is currently a
module-private function there rather than a member, so it needs publishing at
its Rails name.

This is the substrate for the two `@noRailsEquivalent CONVERGEABLE` receipts
in the retired 0023 story
`rack-uploaded-file-publishes-tempfile-and-filename-readers`: `method_missing`
forwarding to `@tempfile` (`uploaded_file.rb:35-41`) only means something once
`@tempfile` is a real Tempfile. Sequence this one first.

## Converged shape

- `UploadedFile#initialize` mirrors `uploaded_file.rb:22-27` line for line:
  `File.isExist` guard, `File.basename`, a real `Tempfile` named
  `[originalFilename, File.extname(path)]` opened BINARY, the `binmode` arm,
  then `FileUtils.copyFile(path, tempfile.path)`.
- `FileUtils.copy_file` is published as a member at its Rails name
  (`file-utils.ts` has the body already, module-private).
- `makeTempfile` and the `UploadedFileTempfile` interface are deleted; `path`
  answers the tempfile's path, as `uploaded_file.rb:30-31` does.
- Deps: RFC 0129's `move-tempfile-to-ruby-compat`, so `rack` can construct a
  `Tempfile` without an activesupport edge.

## Acceptance criteria

- `new UploadedFile(path).path` is a tempfile path, not the source path, and
  the tempfile carries the source's extension.
- The source file is unmodified after writing through the UploadedFile.
- `makeTempfile` is gone from `packages/rack/src/multipart/uploaded-file.ts`.
- `FileUtils.copyFile` is a public member and the copy goes through it.
- `packages/rack/src/multipart/` tests, including the binary-String
  assertions in `uploaded-file.trails.test.ts`, stay green.
