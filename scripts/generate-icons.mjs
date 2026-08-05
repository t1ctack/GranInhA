/**
 * Generates favicon.ico + PWA icons from src/assets/logo-icon.png.
 * The source PNG has transparent padding around the mascot, so we:
 *  1. Trim the transparent border (tight crop to content)
 *  2. Re-add a small uniform padding (10% each side) so the mascot breathes a little
 *  3. Resize to each target dimension
 *
 * Run with: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const root   = join(__dir, '..')
const src    = join(root, 'src', 'assets', 'logo-icon-cropped.png')
const pub    = join(root, 'public')

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a PNG Buffer at the given square size, trimmed + re-padded */
async function buildPng(size, padFraction = 0.08) {
  const inner = Math.round(size * (1 - padFraction * 2))
  return sharp(src)
    .trim()                              // strip transparent edges
    .resize(inner, inner, {             // scale mascot to fill padded box
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({                           // add uniform transparent padding
      top:    Math.round((size - inner) / 2),
      bottom: Math.round((size - inner) / 2),
      left:   Math.round((size - inner) / 2),
      right:  Math.round((size - inner) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(size, size)                 // ensure exact final dimension
    .png()
    .toBuffer()
}

/** Encode a PNG buffer as a single-image .ico file */
function buildIco(pngBuffers) {
  // ICO header: ICONDIR
  const count  = pngBuffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0,     0)  // reserved
  header.writeUInt16LE(1,     2)  // type: ICO
  header.writeUInt16LE(count, 4)  // number of images

  // ICONDIRENTRY per image (16 bytes each)
  const entries = []
  let   offset  = 6 + count * 16
  for (const buf of pngBuffers) {
    const entry = Buffer.alloc(16)
    const meta  = sharp(buf)
    entry.writeUInt8(0,           0)  // width  (0 = 256+)
    entry.writeUInt8(0,           1)  // height (0 = 256+)
    entry.writeUInt8(0,           2)  // color count
    entry.writeUInt8(0,           3)  // reserved
    entry.writeUInt16LE(1,        4)  // color planes
    entry.writeUInt16LE(32,       6)  // bits per pixel
    entry.writeUInt32LE(buf.length, 8)   // size of image data
    entry.writeUInt32LE(offset,  12)  // offset of image data
    entries.push(entry)
    offset += buf.length
  }

  return Buffer.concat([header, ...entries, ...pngBuffers])
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('Generating icons from', src)

// PWA icons — more padding looks better at large sizes
const png192 = await buildPng(192, 0.08)
const png512 = await buildPng(512, 0.08)
writeFileSync(join(pub, 'pwa-192x192.png'), png192)
writeFileSync(join(pub, 'pwa-512x512.png'), png512)
console.log('✅  pwa-192x192.png')
console.log('✅  pwa-512x512.png')

// Also regenerate the favicon-size PNG in public/
const pngLogo = await buildPng(512, 0.05)
writeFileSync(join(pub, 'logo-icon.png'), pngLogo)
console.log('✅  logo-icon.png (cropped)')

// Favicon ICO: 16, 32, 48 px — very tight crop for legibility at tiny sizes
const ico16 = await buildPng(16, 0.04)
const ico32 = await buildPng(32, 0.04)
const ico48 = await buildPng(48, 0.04)
const icoData = buildIco([ico16, ico32, ico48])
writeFileSync(join(pub, 'favicon.ico'), icoData)
console.log('✅  favicon.ico (16×16, 32×32, 48×48)')

console.log('Done.')
