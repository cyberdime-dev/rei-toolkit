#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
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

function headerInfo(content) {
  if (!content.startsWith('/*\n * REI Toolkit')) return { has: false }
  const endIdx = content.indexOf('*/\n')
  const block = endIdx >= 0 ? content.slice(0, endIdx + 3) : ''
  const isAGPL = /License:\s*AGPL-3\.0-only/.test(block)
  const isBSL = /License:\s*BSL-1\.1/.test(block)
  return { has: true, isAGPL, isBSL, endIdx }
}

function ensureHeader(file, expected) {
  const content = fs.readFileSync(file, 'utf8')
  const info = headerInfo(content)
  if (!info.has) {
    fs.writeFileSync(file, expected + content, 'utf8')
    return 1
  }
  // Replace if wrong license
  const hasCorrect = (expected.includes('AGPL') && info.isAGPL) || (expected.includes('BSL') && info.isBSL)
  if (!hasCorrect) {
    const rest = content.slice(info.endIdx + 3)
    fs.writeFileSync(file, expected + rest, 'utf8')
    return 1
  }
  return 0
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

  console.log(`Found ${coreFiles.length} core files and ${proFiles.length} pro files to check.`)
  if (coreFiles.length) {
    console.log('Example core file:', coreFiles[0])
  }
  if (proFiles.length) {
    console.log('Example pro file:', proFiles[0])
  }

  let added = 0
  for (const f of coreFiles) {
    if (fs.existsSync(f)) added += ensureHeader(f, AGPL_HEADER)
  }
  for (const f of proFiles) {
    if (fs.existsSync(f)) added += ensureHeader(f, BSL_HEADER)
  }
  console.log(`Applied headers to ${added} files.`)
}

main()
