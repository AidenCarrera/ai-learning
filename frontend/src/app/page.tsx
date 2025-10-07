"use client";

import { useState } from "react";
import type { GenerateResponse, GenerationMode, UploadResponse } from "../types/api";

export default function Home() {
  const [mode, setMode] = useState<GenerationMode>("flashcards");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    setError(null);
    setUploadInfo(null);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (text.trim()) form.append("text", text.trim());
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as UploadResponse | { error?: string };
      if ("error" in data && data.error) throw new Error(data.error);
      setUploadInfo(data as UploadResponse);
      if (!text && (data as UploadResponse).extracted_text) {
        setText((data as UploadResponse).extracted_text);
      }
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = (await res.json()) as GenerateResponse;
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">AI-Learning</h1>
        <p className="text-sm text-foreground/70 mb-6">
          Convert PDFs or text into flashcards, quizzes, and tests (mock demo).
        </p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Upload PDF (optional)</label>
            <input
              className="block w-full rounded border border-black/10 dark:border-white/15 p-2 bg-transparent"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={handleUpload}
              className="inline-flex w-fit items-center gap-2 rounded bg-foreground text-background px-3 py-2 text-sm hover:opacity-90"
            >
              Upload to Extract Text
            </button>
            {uploadInfo && (
              <div className="text-xs text-foreground/70">
                Extracted {uploadInfo.extracted_text.length} chars • {uploadInfo.chunks.length} chunk(s)
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium">Or paste text</label>
            <textarea
              className="min-h-[160px] rounded border border-black/10 dark:border-white/15 p-3 bg-transparent"
              placeholder="Paste text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Mode</label>
            <div className="flex gap-2">
              {["flashcards", "quiz", "test"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m as GenerationMode)}
                  className={`px-3 py-1.5 rounded border text-sm ${
                    mode === m
                      ? "bg-foreground text-background border-transparent"
                      : "border-black/10 dark:border-white/15"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded bg-foreground text-background px-4 py-2 text-sm hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>

        {result && (
          <div className="mt-8 grid gap-6">
            {result.flashcards?.length > 0 && (
              <section>
                <h2 className="font-medium mb-2">Flashcards</h2>
                <div className="grid gap-2">
                  {result.flashcards.map((fc, idx) => (
                    <div key={idx} className="rounded border border-black/10 dark:border-white/15 p-3">
                      <div className="font-semibold">Q: {fc.question}</div>
                      <div className="text-sm">A: {fc.answer}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.quiz?.length > 0 && (
              <section>
                <h2 className="font-medium mb-2">Quiz</h2>
                <div className="grid gap-3">
                  {result.quiz.map((q, idx) => (
                    <div key={idx} className="rounded border border-black/10 dark:border-white/15 p-3">
                      <div className="font-semibold">{q.question}</div>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {q.options.map((opt, i) => (
                          <li key={i} className={i === q.correct_index ? "font-semibold" : ""}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.test?.length > 0 && (
              <section>
                <h2 className="font-medium mb-2">Short Test</h2>
                <div className="grid gap-2">
                  {result.test.map((t, idx) => (
                    <div key={idx} className="rounded border border-black/10 dark:border-white/15 p-3">
                      <div className="font-semibold">Q: {t.question}</div>
                      <div className="text-sm">A: {t.answer}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.summary && (
              <p className="text-xs text-foreground/60">{result.summary}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
