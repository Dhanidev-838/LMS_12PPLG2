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
    <div className="mb-5 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Masukkan kode kelas atau link undangan"
          className="min-w-0 flex-1 rounded-lg border border-[#D1D5DB] px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-lg bg-[#6B85F6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5873E8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Gabung Kelas"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
      {success && <p className="mt-2 text-xs font-medium text-green-600">{success}</p>}
    </div>
  );
}
