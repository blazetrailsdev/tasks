## Notes

Write `await` on every `blob.url`, `serviceUrlForDirectUpload` and `variant.url`
call even while they are sync. The `activestorage-cloud-services` RFC makes them
async, and this way either landing order is correct.
