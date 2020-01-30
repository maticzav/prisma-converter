#!/usr/bin/env node
import * as fs from 'fs'
import { parse } from 'graphql'
import meow from 'meow'
import * as path from 'path'

import { convertDocument } from '.'

/* CLI */

const cli = meow(
  `
    Usage
      $ prisma-convert <datamodel.graphql>

    NOTE: 
      * You should concatenate your files into one file or migrate them separately.
      * Path to datamodel should be relative to your cwd.
`,
  {},
)

/* Run */

const schemaPath = path.resolve(process.cwd(), cli.input[0])
const schema = fs.readFileSync(schemaPath, { encoding: 'utf-8' })
const doc = parse(schema)

console.log(convertDocument(doc))
