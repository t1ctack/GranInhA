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

async function cropLogo(src, dest) {
  const buf = readFileSync(src)
  const b   = await findContentBounds(buf)

  const cropW = b.right  - b.left + 1
  const cropH = b.bottom - b.top  + 1

  console.log(`${src.split(/[\\/]/).pop()}`)
  console.log(`  original : ${b.width} × ${b.height}`)
  console.log(`  content  : ${b.contentW} × ${b.contentH}`)
  console.log(`  crop box : left=${b.left} top=${b.top} ${cropW}×${cropH}`)

  await sharp(buf)
    .extract({ left: b.left, top: b.top, width: cropW, height: cropH })
    .png()
    .toFile(dest)

  console.log(`  → saved  : ${dest.split(/[\\/]/).pop()}\n`)
}

await cropLogo(
  join(ASSETS, 'logo-full.png'),
  join(ASSETS, 'logo-full-cropped.png'),
)

await cropLogo(
  join(ASSETS, 'logo-icon.png'),
  join(ASSETS, 'logo-icon-cropped.png'),
)
