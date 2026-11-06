# Original image archive

These seven original PNG files are preserved byte-for-byte outside `public/` so Astro does not copy 87,228,632 bytes (83.19 MiB) of unused originals into every static deployment. The site already displays their corresponding WebP images.

`vercel.json` redirects each former `/images/*.png` URL to its matching existing WebP, preserving access through historical links after deployment. Local Astro preview does not implement Vercel redirect rules; verify those redirects on Vercel after an authorized release.

The pre-change originals are also in checkpoint `codex/backup/pre-health-fixes-2026-11-06-65d96ce` and its verified repository bundle. No original image was deleted or recompressed. The unused `hero-bg-1.png` remains public because it has no confirmed equivalent WebP replacement.

Do not reference this archive from website markup. For a new image change, use the appropriate source asset and obtain the required content approval.
