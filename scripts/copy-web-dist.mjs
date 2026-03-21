import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const sourceDir = resolve(repoRoot, 'apps/web/dist')
const targetDir = resolve(repoRoot, 'apps/server/dist/public')

if (!existsSync(sourceDir)) {
  throw new Error(`Web build not found: ${sourceDir}`)
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true })

console.log(`Copied ${sourceDir} -> ${targetDir}`)
