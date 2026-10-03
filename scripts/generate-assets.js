import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateSocialAssets() {
  const publicDir = path.resolve('public');

  // 1. OG Image (1200 x 630)
  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070a12" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <circle cx="200" cy="150" r="300" fill="url(#glowGrad)" filter="blur(60px)" />
    <circle cx="1050" cy="480" r="260" fill="url(#glowGrad)" filter="blur(60px)" />

    <!-- Grid lines subtle -->
    <path d="M0 100 H1200 M0 200 H1200 M0 300 H1200 M0 400 H1200 M0 500 H1200" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
    <path d="M200 0 V630 M400 0 V630 M600 0 V630 M800 0 V630 M1000 0 V630" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />

    <!-- Brand Card Container -->
    <rect x="100" y="80" width="1000" height="470" rx="32" fill="#131b2e" fill-opacity="0.8" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2" />

    <!-- Logo Icon -->
    <g transform="translate(160, 140)">
      <rect width="84" height="84" rx="24" fill="url(#primaryGrad)" />
      <!-- Stylized Z Bolt -->
      <path d="M26 24 H58 L38 42 H58 L26 62 L36 44 H26 Z" fill="#ffffff" />
    </g>

    <!-- Title & Subtitle -->
    <text x="270" y="195" font-family="Plus Jakarta Sans, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="-1">ZenithStudy</text>
    <text x="270" y="235" font-family="Plus Jakarta Sans, sans-serif" font-size="20" font-weight="600" fill="#10b981">FOCUS PRODUCTIVITY OS &amp; STUDY TIMER</text>

    <!-- Feature Highlights -->
    <text x="160" y="320" font-family="Plus Jakarta Sans, sans-serif" font-size="26" font-weight="700" fill="#f1f5f9">
      Deep Focus Timer • Spotify &amp; BG Music • 100+ Aesthetic Wallpapers
    </text>
    <text x="160" y="365" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="400" fill="#94a3b8">
      Real-Time Peer Study Rooms, Subject Analytics, 10-Min Timetable Planner &amp; D-Day Goal Tracking
    </text>

    <!-- Badges -->
    <g transform="translate(160, 420)">
      <!-- Badge 1: 100+ Wallpapers -->
      <rect x="0" y="0" width="190" height="44" rx="14" fill="#6366f1" fill-opacity="0.15" stroke="#6366f1" stroke-opacity="0.4" />
      <text x="20" y="28" font-family="Plus Jakarta Sans, sans-serif" font-size="15" font-weight="600" fill="#818cf8">✨ 100+ Wallpapers</text>

      <!-- Badge 2: Spotify & BG Beats -->
      <rect x="210" y="0" width="220" height="44" rx="14" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.4" />
      <text x="230" y="28" font-family="Plus Jakarta Sans, sans-serif" font-size="15" font-weight="600" fill="#34d399">🎧 Spotify &amp; BG Audio</text>

      <!-- Badge 3: PWA App -->
      <rect x="450" y="0" width="170" height="44" rx="14" fill="#ec4899" fill-opacity="0.15" stroke="#ec4899" stroke-opacity="0.4" />
      <text x="470" y="28" font-family="Plus Jakarta Sans, sans-serif" font-size="15" font-weight="600" fill="#f472b6">📱 Installable App</text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .png({ quality: 90 })
    .toFile(path.join(publicDir, 'og-image.png'));

  // 2. Desktop Screenshot (1280 x 720)
  const desktopSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#0b0f17" />
    <circle cx="640" cy="360" r="350" fill="#6366f1" fill-opacity="0.15" filter="blur(80px)" />

    <!-- Top Bar -->
    <rect x="0" y="0" width="1280" height="56" fill="#0f172a" fill-opacity="0.9" />
    <circle cx="36" cy="28" r="6" fill="#10b981" />
    <text x="52" y="32" font-family="sans-serif" font-size="13" font-weight="600" fill="#94a3b8">Live Workspace</text>

    <!-- Center Timer Mock -->
    <circle cx="640" cy="350" r="160" fill="none" stroke="#1e293b" stroke-width="12" />
    <circle cx="640" cy="350" r="160" fill="none" stroke="#6366f1" stroke-width="12" stroke-dasharray="1005" stroke-dashoffset="280" />
    <text x="640" y="340" text-anchor="middle" font-family="monospace" font-size="64" font-weight="800" fill="#ffffff">25:00</text>
    <text x="640" y="380" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#818cf8">DEEP STUDY SESSION</text>

    <!-- Music Bar Dock -->
    <rect x="940" y="630" width="300" height="60" rx="18" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
    <text x="965" y="665" font-family="sans-serif" font-size="14" font-weight="700" fill="#ffffff">🎵 Lofi Study Beats (Playing)</text>
  </svg>
  `;

  await sharp(Buffer.from(desktopSvg))
    .png({ quality: 90 })
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));

  // 3. Mobile Screenshot (640 x 1136)
  const mobileSvg = `
  <svg width="640" height="1136" viewBox="0 0 640 1136" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="1136" fill="#0b0f17" />
    <circle cx="320" cy="400" r="220" fill="#6366f1" fill-opacity="0.18" filter="blur(60px)" />

    <!-- Timer Ring -->
    <circle cx="320" cy="460" r="140" fill="none" stroke="#1e293b" stroke-width="12" />
    <circle cx="320" cy="460" r="140" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="880" stroke-dashoffset="200" />
    <text x="320" y="460" text-anchor="middle" font-family="monospace" font-size="52" font-weight="800" fill="#ffffff">25:00</text>
    <text x="320" y="500" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="#34d399">DEEP FOCUS</text>

    <!-- Floating Dock -->
    <rect x="40" y="980" width="560" height="80" rx="24" fill="#0f172a" stroke="#ffffff" stroke-opacity="0.1" />
    <text x="320" y="1028" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#ffffff">🎧 Background Study Audio Active</text>
  </svg>
  `;

  await sharp(Buffer.from(mobileSvg))
    .png({ quality: 90 })
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));

  console.log('Successfully generated og-image.png, screenshot-desktop.png, screenshot-mobile.png');
}

generateSocialAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
