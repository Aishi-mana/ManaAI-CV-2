# Mana web search

Mana uses a local SearXNG service. It sends only the submitted question to the service. SearXNG forwards the query to its configured search engines. Mana uses the returned snippets to draft an answer locally and displays the source links.

Open Docker Desktop and run these commands in PowerShell. The first downloads the official public image.

```powershell
docker pull ghcr.io/searxng/searxng:latest
docker compose -f C:\AI\ManaAI-CV-2\tools\searxng\compose.yml up -d
```

The service listens on `127.0.0.1:8879`. Once it is running, start Mana's chat model and send your question normally. Mana can choose to look up public facts. To require a lookup, send **Search the web for** followed by your question. You can also send **Search the web** after a question to look up that question. Docker restarts the service when its engine starts, unless you stopped the container yourself.

To stop the service, run `docker compose -f tools/searxng/compose.yml stop`.
