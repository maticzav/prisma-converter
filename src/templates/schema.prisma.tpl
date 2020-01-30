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