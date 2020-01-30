import * as fs from 'fs'
import { parse } from 'graphql'
import * as path from 'path'

import { convertDocument } from '../src'

describe('converter', () => {
  test('correctly converts the file', async () => {
    const datamodel = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/datamodel.graphql'),
      {
        encoding: 'utf-8',
      },
    )
    const document = parse(datamodel)

    expect(convertDocument(document)).toMatchSnapshot()
  })
})
