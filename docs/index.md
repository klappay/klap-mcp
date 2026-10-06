---
layout: home

hero:
  name: '@klappay/mcp'
  text: The Klap Core API, inside your AI assistant
  tagline: A local stdio MCP server for Claude Code, Claude Desktop, Cursor or any MCP client. It runs on your machine with the key klap login already stored — nothing hosted, read-only in live by default.
  image:
    src: /logo.png
    alt: '@klappay/mcp'
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/klappay/klap-mcp

features:
  - title: Getting started
    details: Store a test key with the CLI, add the server to your MCP client, and try your first prompts.
    link: /getting-started
  - title: Configuration
    details: How KLAP_ENV, KLAP_API_KEY and KLAP_BASE_URL pick the key and host, and every startup refusal.
    link: /configuration
  - title: Tools
    details: Read charges, timelines, webhooks, deliveries, networks and metrics; create and check test charges; drive sandbox events.
    link: /tools
  - title: Security
    details: Live is read-only unless you opt in, a stored key only goes to its stored host, and money-moving endpoints are never exposed.
    link: /security
---
