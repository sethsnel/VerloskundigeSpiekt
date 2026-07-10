import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import openapiTS from 'openapi-typescript'
import * as ts from 'typescript'

const output = resolve(process.cwd(), 'lib/api/openapi.generated.ts')
const openApiUrl = process.env.API_OPENAPI_URL ?? 'http://localhost:8080/openapi/v1.json'
const document = await fetch(openApiUrl).then(async response => {
  if (!response.ok) throw new Error(`Unable to fetch OpenAPI document from ${openApiUrl}: ${response.status}`)
  return response.json()
})
const result = await openapiTS(document)
await mkdir(resolve(process.cwd(), 'lib/api'), { recursive: true })
const source = typeof result === 'string'
  ? result
  : result.map(node => ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printNode(ts.EmitHint.Unspecified, node, ts.createSourceFile('openapi.generated.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS))).join('\n')
await import('node:fs/promises').then(fs => fs.writeFile(output, source))
