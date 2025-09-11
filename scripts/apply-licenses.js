#!/usr/bin/env node
/*
 Applies license headers to source files per licensing/feature-map.json.
 - AGPL header for open_source_core areas
 - BSL header for commercial_premium areas
 Skips files that already contain a matching header marker.
*/

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const FEATURE_MAP_PATH = path.join(ROOT, 'licensing', 'feature-map.json')

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function listFiles(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...listFiles(p))
    else out.push(p)
  }
  return out
}

const AGPL_HEADER = `/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */\n`

const BSL_HEADER = `/*
 * REI Toolkit - Commercial Premium
 * License: BSL-1.1 (Change Date: 2029-09-11 → Apache-2.0)
 * See LICENSES.md and licensing/feature-map.json
 */\n`

function hasHeader(content) {
  return content.startsWith('/*\n * REI Toolkit')
}

function applyHeader(file, header) {
  const content = fs.readFileSync(file, 'utf8')
  if (hasHeader(content)) return false
  const withHeader = header + content
  fs.writeFileSync(file, withHeader, 'utf8')
  return true
}

function isCodeFile(file) {
  return /(\.js|\.ts|\.vue|\.css)$/i.test(file)
}

function resolvePathsFromFeatureMap(mapSection) {
  const base = path.join(ROOT)
  const include = new Set()
  ;(mapSection.directories || []).forEach(d => {
    const abs = path.join(base, d)
    listFiles(abs).forEach(f => include.add(f))
  })
  ;(mapSection.files || []).forEach(f => include.add(path.join(base, f)))
  return Array.from(include).filter(isCodeFile)
}

function main() {
  const fmap = readJSON(FEATURE_MAP_PATH)
  const core = fmap.feature_boundaries.open_source_core
  const pro = fmap.feature_boundaries.commercial_premium

  const coreFiles = resolvePathsFromFeatureMap(core)
  const proFiles = resolvePathsFromFeatureMap(pro)

  let added = 0
  for (const f of coreFiles) {
    if (fs.existsSync(f)) added += applyHeader(f, AGPL_HEADER) ? 1 : 0
  }
  for (const f of proFiles) {
    if (fs.existsSync(f)) added += applyHeader(f, BSL_HEADER) ? 1 : 0
  }
  console.log(`Applied headers to ${added} files.`)
}

main()
