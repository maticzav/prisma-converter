import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  EnumTypeDefinitionNode,
  DefinitionNode,
  DirectiveNode,
  IntValueNode,
  FloatValueNode,
  StringValueNode,
  BooleanValueNode,
  TypeNode,
} from 'graphql'
import { extractType } from '@graphql-toolkit/schema-merging'
import { render } from 'mustache'

/**
 * NOTE:
 * Converter doesn't support @relationTable and @db directives yet.
 */

/* Globals */

const TEMPLATE = `
datasource pg {
  provider = "postgres"
  url = env("POSTGRESQL_URL")
}

generator photon {
  provider = "prisma-client-js"
}

{{#models}}
model {{name}} {
  {{#fields}}
  {{name}} {{type}}{{#optional}}?{{/optional}}{{#list}}[]{{/list}} {{#id}}@id @default(cuid()){{/id}} {{#unique}}@unique{{/unique}} {{#createdAt}}@default(now()){{/createdAt}} {{#updatedAt}}@updatedAt{{/updatedAt}} {{#default}}@default("{{value}}"){{/default}} {{#relation}}@relation(name: "{{name}}"){{/relation}}
  {{/fields}}
}

{{/models}}


{{#enums}}
enum {{name}} {
  {{#members}}
  {{name}}
  {{/members}}
}

{{/enums}}
`

/* Converters */

type Model = {
  name: string
  fields: Field[]
  /* Directives */
  isRelationTable: boolean
}

type Enum = {
  name: string
  members: { name: string }[]
}

type Field = {
  name: string
  type: string
  /* Modifiers */
  optional: boolean
  list: boolean
  /* Directives */
  id: boolean
  unique: boolean
  scalarList: boolean /* @scalarList(strategy: RELATION) */
  createdAt: boolean
  updatedAt: boolean
  default?: { value: string }
  /* Relations */
  relation?: {
    name: string
    link: 'INLINE' | 'TABLE'
    onDelete: 'SET_NULL' | 'CASCADE'
  }
}

type Directive = {
  name: string
  arguments: Argument[]
}

type Argument = {
  name: string
  value: string
}

/**
 * Converts Prisma 1.0 schema to Prisma 2.0 data model.
 *
 * @param document
 */
export function convertDocument(document: DocumentNode): string {
  const definitions = document.definitions

  const models = definitions.filter(isModel).map(convertModel)
  const enums = definitions.filter(isEnum).map(convertEnum)

  return render(TEMPLATE, {
    models,
    enums,
  })
}

function convertModel(definition: ObjectTypeDefinitionNode): Model {
  return {
    name: definition.name.value,
    fields: definition?.fields?.map(convertField) || [],
    isRelationTable: includeDirective(definition.directives, 'relationTable'),
  }
}

/**
 * Migrates a field definition from DSL.
 * @param definition
 */
function convertField(definition: FieldDefinitionNode): Field {
  const field = extractType(definition.type)
  const directives = getFieldDirectives(definition)

  return {
    name: definition.name.value,
    type: convertType(field.name.value),
    /* Modifications */
    optional:
      !isNonNullTypeNode(definition.type) && !isListTypeNode(definition.type),
    list: isListTypeNode(definition.type),
    /* Directives */
    id: includeDirective(definition.directives, 'id'),
    unique: includeDirective(definition.directives, 'unique'),
    scalarList: includeDirective(definition.directives, 'scalarList'),
    createdAt: includeDirective(definition.directives, 'createdAt'),
    updatedAt: includeDirective(definition.directives, 'updatedAt'),
    default: directives?.default as Field['default'],
    relation: directives?.relation as Field['relation'],
  }
}

/**
 * Determines whether a field is a list.
 * @param definition
 */
function isListTypeNode(definition: TypeNode): boolean {
  switch (definition.kind) {
    case 'ListType': {
      return true
    }
    case 'NonNullType': {
      return isListTypeNode(definition.type)
    }
    case 'NamedType': {
      return false
    }
  }
}

/**
 * Determines whether a definition is a non-nullable type.
 * @param definition
 */
function isNonNullTypeNode(definition: TypeNode): boolean {
  switch (definition.kind) {
    case 'ListType': {
      return false
    }
    case 'NonNullType': {
      return true
    }
    case 'NamedType': {
      return false
    }
  }
}

/**
 * Fixes type name changes.
 * @param type
 */
function convertType(type: string): string {
  switch (type) {
    case 'ID': {
      return 'String'
    }
    default: {
      return type
    }
  }
}

function getFieldDirectives(
  field: FieldDefinitionNode,
):
  | {
      [key: string]: { [key: string]: any } | null
    }
  | undefined {
  return field.directives?.reduce((acc, dir) => {
    const args = dir.arguments?.reduce<{ [key: string]: any }>((acc, arg) => {
      return {
        ...acc,
        [arg.name.value]: (arg.value as
          | IntValueNode
          | FloatValueNode
          | StringValueNode
          | BooleanValueNode).value,
      }
    }, {})

    return {
      ...acc,
      [dir.name.value]: args || null,
    }
  }, {})
}

/**
 * Checks whether directives include a specified directive.
 *
 * @param definitions
 * @param name
 */
function includeDirective(
  definitions: readonly DirectiveNode[] | undefined,
  name: string,
): boolean {
  return definitions?.some(directive => directive.name.value === name) || false
}

function convertEnum(definition: EnumTypeDefinitionNode): Enum {
  return {
    name: definition.name.value,
    members: definition?.values?.map(val => ({ name: val.name.value })) || [],
  }
}

/* Identifiers */

function isEnum(node: DefinitionNode): node is EnumTypeDefinitionNode {
  return node.kind === 'EnumTypeDefinition'
}

function isModel(node: DefinitionNode): node is ObjectTypeDefinitionNode {
  return node.kind === 'ObjectTypeDefinition'
}
