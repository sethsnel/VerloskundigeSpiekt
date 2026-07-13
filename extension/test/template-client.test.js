import assert from 'node:assert/strict'
import test from 'node:test'
import { substituteLocally } from '../template-client.js'
const definition = JSON.stringify({ version: 1, subject: [{ type: 'text', value: 'Hello ' }, { type: 'placeholder', key: 'patient.firstName' }], body: [{ type: 'placeholder', key: 'patient.note' }] })
test('substitution stays structural and safely escapes JSON-significant Unicode values', () => { const value = 'Anne "A" \\ /\n☃'; const result = JSON.parse(substituteLocally(definition, { 'patient.firstName': value, 'patient.note': value })); assert.equal(result.subject[1].value, value); assert.equal(result.body[0].value, value) })
test('missing values and invalid shapes fail closed', () => { assert.throws(() => substituteLocally(definition, {}), /Missing/); assert.throws(() => substituteLocally('{"body":[]}', {}), /Invalid/) })
