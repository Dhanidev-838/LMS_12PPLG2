"use client";

import { FormEvent, useState } from "react";

interface JoinClassFormProps {
  onSuccess?: () => void;
}

function extractToken(value: string) {
  const input = value.trim();
  if (!input) return "";

  try {
    const url = new URL(input);
    const match = url.pathname.match(/\/join\/([^/]+)/);
    return match?.[1] ?? "";
  } catch {
    const match = input.match(/(?:^|\/)join\/([^/?#]+)/i);
    return match?.[1] ?? input.split(/[/?#]/)[0];
  }
}

export default function JoinClassForm({ onSuccess }: JoinClassFormProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const token = extractToken(value);
    if (!token) {
      setError("Masukkan kode kelas atau link undangan.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/kelas/join/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Gagal bergabung ke kelas.");
        return;
      }

      setValue("");
      setSuccess(data.message ?? "Berhasil bergabung ke kelas.");
      onSuccess?.();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Masukkan kode kelas atau link undangan"
          aria-label="Kode kelas atau tautan undangan"
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="min-h-10 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Gabung Kelas"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      {success && <p className="mt-2 text-xs font-medium text-foreground">{success}</p>}
    </div>
  );
}
