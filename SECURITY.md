# Security Notes

## Repository Scope

This public repository should contain only application code, sanitized documentation, and deployment configuration.

Do not store the following here:

- API keys, tokens, passwords, or secret URLs
- Database exports or spreadsheets with internal data
- Private handoff instructions or backup locations
- Screenshots or documents containing sensitive operational details

## Current Deployment Model

This site is deployed as a static export to GitHub Pages. Anything shipped in the frontend bundle should be treated as public.

Because of that:

- Do not rely on frontend-hidden secrets
- Keep privileged actions behind Supabase Auth and database policies
- Prefer email-link authentication over shared passwords

## Recommended Controls

1. Enable MFA on GitHub, Supabase, and maintainer email accounts.
2. Keep GitHub Actions secrets only in GitHub Secrets or another approved secret manager.
3. Rotate secrets whenever a maintainer leaves or access changes.
4. Review Supabase Row Level Security policies regularly.
5. Keep backups encrypted and outside the published site.

## Reporting

If you discover a security issue, avoid opening a public issue with exploit details. Share it privately with the maintainer through an approved channel first.
