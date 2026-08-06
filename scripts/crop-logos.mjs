import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ASSETS = join(__dir, '../src/assets')
const MARGIN = 8  // px safety margin around detected content

async function findContentBounds(imgBuffer) {
  const { data, info } = await sharp(imgBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  let minX = width, maxX = 0, minY = height, maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha > 8) {          // treat near-transparent as transparent
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  return {
    left:   Math.max(0, minX - MARGIN),
    top:    Math.max(0, minY - MARGIN),
    right:  Math.min(width  - 1, maxX + MARGIN),
    bottom: Math.min(height - 1, maxY + MARGIN),
    width,
    height,
    contentW: maxX - minX + 1,
    contentH: maxY - minY + 1,
  }
}

// Display width (px) for the optimized in-app asset. Chosen with ~3.5x
// headroom over the largest on-screen usage so retina displays stay crisp
// while keeping the shipped file tiny.
async function cropLogo(src, dest, { displayWidth, hiresDest } = {}) {
  const buf = readFileSync(src)
  const b   = await findContentBounds(buf)

  const cropW = b.right  - b.left + 1
  const cropH = b.bottom - b.top  + 1

  console.log(`${src.split(/[\\/]/).pop()}`)
  console.log(`  original : ${b.width} × ${b.height}`)
  console.log(`  content  : ${b.contentW} × ${b.contentH}`)
  console.log(`  crop box : left=${b.left} top=${b.top} ${cropW}×${cropH}`)

  const cropped = await sharp(buf)
    .extract({ left: b.left, top: b.top, width: cropW, height: cropH })
    .png()
    .toBuffer()

  // Optional lossless full-resolution copy, kept only as a source for
  // build-time tooling (e.g. favicon/PWA icon generation) — never imported
  // by app code, so it costs nothing in the shipped bundle.
  if (hiresDest) {
    await sharp(cropped).png({ compressionLevel: 9 }).toFile(hiresDest)
    console.log(`  → hires  : ${hiresDest.split(/[\\/]/).pop()}`)
  }

  // Optimized small version actually imported by the app UI: resized to
  // real display size + palette-quantized PNG for a drastically smaller file.
  await sharp(cropped)
    .resize({ width: displayWidth })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(dest)

  console.log(`  → saved  : ${dest.split(/[\\/]/).pop()}\n`)
}

await cropLogo(
  join(ASSETS, 'logo-full.png'),
  join(ASSETS, 'logo-full-cropped.png'),
  { displayWidth: 720 },
)

await cropLogo(
  join(ASSETS, 'logo-icon.png'),
  join(ASSETS, 'logo-icon-cropped.png'),
  { displayWidth: 360, hiresDest: join(ASSETS, 'logo-icon-cropped-hires.png') },
)

await cropLogo(
  join(ASSETS, 'logo-full-light.png'),
  join(ASSETS, 'logo-full-light-cropped.png'),
  { displayWidth: 720 },
)
