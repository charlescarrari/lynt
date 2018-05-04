import { Linter, Configuration, ILinterOptions } from 'tslint'
import globby from 'globby'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import getConfig from './config'
import { LyntOptions, LyntResults } from '../types'

function tslint(paths: Array<string>, options: LyntOptions): LyntResults {
  let projectRoot = options.project

  if (!projectRoot && paths.length === 0) {
    projectRoot = '.'
  }

  const config = getConfig(options)
  const configPath = join(__dirname, 'tslint.json')

  writeFileSync(configPath, JSON.stringify(config, null, 2))

  const tslintConfig = Configuration.findConfiguration(configPath).results
  const tslintOptions = {
    fix: !!options.fix,
    formatter: options.json ? 'json' : 'stylish'
  }

  let tslint: Linter
  let filesToLint: Array<string>

  if (projectRoot && paths.length === 0) {
    const tsconfig = join(projectRoot, 'tsconfig.json')
    const program = Linter.createProgram(tsconfig, projectRoot)
    tslint = new Linter(tslintOptions, program)
    filesToLint = Linter.getFileNames(program)
  } else {
    tslint = new Linter(tslintOptions)
    filesToLint = globby.sync(paths)
  }

  filesToLint.forEach(file => {
    const fileContents = readFileSync(file, 'utf8')
    tslint.lint(file, fileContents, tslintConfig)
  })

  unlinkSync(configPath)

  const { errorCount, output } = tslint.getResult()

  const results: LyntResults = {
    errorCount,
    output
  }

  return results
}

export default tslint
