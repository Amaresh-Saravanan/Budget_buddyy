#!/usr/bin/env node
//
// Generates the app icon and splash source images from SVG, so the artwork
// is reproducible rather than a binary someone dropped in years ago.
//
// The PNGs it writes are committed, so you only need to run this if the
// artwork changes. It needs sharp, which is a heavy native dependency and
// deliberately not a permanent devDependency for a script run this rarely:
//
//   cd frontend
//   npm install --no-save sharp
//   node scripts/generate-icons.mjs
//   npx @capacitor/assets generate --android
//
// @capacitor/assets then produces every Android density from these.

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = join(__dirname, '..', 'assets')

// Brand colours, matching the app's own palette.
const PURPLE_LIGHT = '#c79bff'
const PURPLE = '#bb86fc'
const PURPLE_DEEP = '#7c4dff'
const GREEN = '#00ff88'
const INK = '#0f0f0f'
const CARD_WHITE = '#ffffff'

// A wallet with a card tucked behind it, drawn on a 1024 grid.
// `scale` shrinks the mark toward the centre — Android's adaptive icon mask
// crops roughly the outer third, so the foreground layer needs headroom.
function walletMark(scale = 1) {
  const t = `translate(512 512) scale(${scale}) translate(-512 -512)`
  return `
    <g transform="${t}">
      <!-- card peeking out from behind the wallet -->
      <rect x="300" y="248" width="424" height="140" rx="34" fill="${GREEN}"/>
      <rect x="300" y="248" width="424" height="140" rx="34" fill="${INK}" opacity="0.08"/>

      <!-- wallet body -->
      <rect x="228" y="336" width="568" height="392" rx="60" fill="${CARD_WHITE}"/>

      <!-- clasp pocket on the right edge -->
      <path d="M796 468 H660 a76 76 0 0 0 0 152 h136 a28 28 0 0 0 28-28 V496 a28 28 0 0 0-28-28 Z"
            fill="${PURPLE_LIGHT}" opacity="0.55"/>
      <circle cx="700" cy="544" r="34" fill="${PURPLE_DEEP}"/>
    </g>`
}

function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${PURPLE_LIGHT}"/>
        <stop offset="1" stop-color="${PURPLE_DEEP}"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="232" fill="url(#bg)"/>
    ${walletMark(0.82)}
  </svg>`
}

function iconBackgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${PURPLE_LIGHT}"/>
        <stop offset="1" stop-color="${PURPLE_DEEP}"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
  </svg>`
}

// Transparent foreground layer for Android's adaptive icon. The mark spans
// about 55% of the canvas at scale 1, and the adaptive mask guarantees only
// the middle ~66% is visible — so scale 1 sits inside the safe zone with
// margin to spare, while anything much smaller just looks lost in the frame.
function iconForegroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${walletMark(1)}
  </svg>`
}

// Splash is heavily cropped across device aspect ratios, so the mark sits
// small and dead centre on a flat ground.
function splashSvg(background) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
    <rect width="2732" height="2732" fill="${background}"/>
    <g transform="translate(1366 1366) scale(0.62) translate(-512 -512)">
      ${walletMark(0.82)}
    </g>
  </svg>`
}

async function render(svg, filename, size) {
  const out = join(ASSETS, filename)
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log(`  ${filename}  ${size}×${size}`)
}

async function main() {
  await mkdir(ASSETS, { recursive: true })
  console.log('Writing icon and splash sources to frontend/assets:')

  await render(iconSvg(), 'icon.png', 1024)
  await render(iconBackgroundSvg(), 'icon-background.png', 1024)
  await render(iconForegroundSvg(), 'icon-foreground.png', 1024)
  await render(splashSvg('#f4f2fb'), 'splash.png', 2732)
  await render(splashSvg(INK), 'splash-dark.png', 2732)

  // Keep the SVG source next to the PNGs so the artwork can be inspected
  // and edited without running anything.
  await writeFile(join(ASSETS, 'icon.svg'), iconSvg().trim() + '\n')
  console.log('  icon.svg   (source)')
  console.log('\nNext: npx @capacitor/assets generate --android')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
