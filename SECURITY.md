# Security Policy

Please report security issues privately before public disclosure.

## Reporting

Use [GitHub Security Advisories](https://github.com/chayprabs/audio-loudnorm-online/security/advisories/new)
for this repository, or email **security@chaitanyaprabuddha.com** (see also `apps/web/public/security.txt`).

For terms of use and liability, see [Terms & Conditions](apps/web/app/terms/page.tsx) and [LEGAL.md](LEGAL.md).

## Supported versions

Only the latest `main` branch and tagged releases receive fixes.

## Handling uploads

- Uploaded files are processed in ephemeral worker directories.
- Artifacts are expected to be served through signed URLs with expiry.
- File contents and secrets must not be written to logs.
