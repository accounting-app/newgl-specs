import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownModules = import.meta.glob("../../**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function normalizePath(key: string): string {
  return key.replace(/^\.\.\/\.\.\//, "");
}

const docs = Object.entries(markdownModules)
  .map(([key, content]) => ({
    path: normalizePath(key),
    content,
  }))
  .filter((doc) => !doc.path.includes("node_modules/"))
  .sort((a, b) => a.path.localeCompare(b.path));

export default function App() {
  const [selectedPath, setSelectedPath] = useState(docs[0]?.path ?? "");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) => doc.path.toLowerCase().includes(q));
  }, [query]);

  const selected = docs.find((doc) => doc.path === selectedPath) ?? filtered[0];

  return (
    <div className="layout">
      <aside className="sidebar">
        <header className="sidebar-header">
          <h1>New GL Specs</h1>
          <p>{docs.length} markdown files</p>
          <input
            type="search"
            placeholder="Filter files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter markdown files"
          />
        </header>
        <nav className="file-list">
          {filtered.map((doc) => (
            <button
              key={doc.path}
              type="button"
              className={doc.path === selected?.path ? "active" : undefined}
              onClick={() => setSelectedPath(doc.path)}
            >
              {doc.path}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="empty">No files match “{query}”.</p>
          )}
        </nav>
      </aside>
      <main className="content">
        {selected ? (
          <>
            <header className="content-header">
              <code>{selected.path}</code>
            </header>
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selected.content}
              </ReactMarkdown>
            </article>
          </>
        ) : (
          <p className="empty">No markdown files found.</p>
        )}
      </main>
    </div>
  );
}
