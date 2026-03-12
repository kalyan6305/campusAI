# Tools Page Architecture Overview

The **Tools Page** (Research Dashboard) is a sophisticated research environment that combines real-time web search with AI-driven synthesis.

## Core Components

1.  **`ToolsPage.jsx`**:
    *   **Orchestration**: Manages the state for the active search mode (Web vs. Social).
    *   **Layout**: Uses a dual-pane layout with the `ResearchSidebar` on the left and `ChatWindow`/`ChatInput` on the right.
    *   **Data Flow**: Connects to `useChatStore` to trigger searches and stream metadata.

2.  **`ResearchSidebar.jsx`**:
    *   **Source Visualization**: Displays discovered links as "Research Cards".
    *   **Categorization**: Maps backend categories (Documentation, Research, Web, Social) to UI tabs.
    *   **Validation**: Performs client-side URL cleaning to ensure links are readable and safe.

3.  **`ChatWindow.jsx` & `ChatInput.jsx`**:
    *   **Interaction**: standard chat interface but specialized for research streaming.
    *   **Streaming States**: Displays "Searching authoritative sources..." vs "Synthesizing report...".

## Data Pipeline

1.  **Request**: User sends a query through `ToolsPage`.
2.  **Search Intelligence Layer**:
    *   The `WebSearchService` (Backend) generates query variations.
    *   It executes parallel searches across tiered domains (Wikipedia, Python Docs, MDN, StackOverflow, etc.).
    *   **Validation**: A segment-based validator rejects homepages and tag pages, keeping only deep articles.
3.  **Metadata Injection**: Discovered sources are streamed back to the frontend *immediately* (as `METADATA` status) to populate the sidebar while the AI is still "thinking".
4.  **Synthesis**: The `ResearchAgent` receives the web context and produces a cited, professional report.
