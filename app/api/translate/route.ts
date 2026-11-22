import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const TARGET_LANGUAGES: Record<string, string> = {
  id: "ID",
  en: "EN",
  de: "DE",
  ja: "JA",
};
const MAX_TEXT_LENGTH = 10_000;
const MAX_TOTAL_TEXT_LENGTH = 20_000;
const MAX_TEXTS_PER_REQUEST = 50;

interface DeepLResponse {
  translations?: { text?: string }[];
}

export async function POST(req: NextRequest) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: "Silakan login untuk menerjemahkan." }, { status: 401 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || !("locale" in body) || (!("text" in body) && !("texts" in body))) {
      return NextResponse.json({ error: "Konten tidak valid untuk diterjemahkan." }, { status: 400 });
    }

    const locale = body.locale;
    const isLegacyRequest = "text" in body && !("texts" in body);
    const texts = "texts" in body ? body.texts : "text" in body ? [body.text] : null;
    if (
      !Array.isArray(texts) ||
      texts.length === 0 ||
      texts.length > MAX_TEXTS_PER_REQUEST ||
      !texts.every((text) => typeof text === "string" && text.trim()) ||
      typeof locale !== "string" ||
      !TARGET_LANGUAGES[locale]
    ) {
      return NextResponse.json({ error: "Konten tidak valid untuk diterjemahkan." }, { status: 400 });
    }
    if (texts.some((text) => text.length > MAX_TEXT_LENGTH)) {
      return NextResponse.json(
        { error: "Konten terlalu panjang untuk diterjemahkan (maksimal 10.000 karakter)." },
        { status: 413 }
      );
    }
    if (texts.reduce((total, text) => total + text.length, 0) > MAX_TOTAL_TEXT_LENGTH) {
      return NextResponse.json(
        { error: "Jumlah konten terlalu banyak untuk diterjemahkan sekaligus." },
        { status: 413 }
      );
    }

    const authKey = process.env.DEEPL_AUTH_KEY;
    if (!authKey) {
      return NextResponse.json(
        { error: "Fitur terjemahan belum dikonfigurasi. Admin perlu menambahkan DEEPL_AUTH_KEY." },
        { status: 503 }
      );
    }

    const apiBase = authKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
    let response: Response | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(`${apiBase}/v2/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${authKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: texts, target_lang: TARGET_LANGUAGES[locale] }),
      });

      if (response.ok || (response.status !== 429 && response.status < 500) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }

    if (!response) {
      return NextResponse.json({ error: "Terjemahan gagal. Coba lagi." }, { status: 502 });
    }
    if (!response.ok) {
      console.error("DeepL translation request failed", {
        status: response.status,
        traceId: response.headers.get("X-Trace-ID"),
      });
      const error =
        response.status === 456
          ? "Kuota terjemahan DeepL habis."
          : "Terjemahan gagal. Coba lagi.";
      return NextResponse.json({ error }, { status: response.status === 456 ? 503 : 502 });
    }

    const result = (await response.json()) as DeepLResponse;
    const translations = result.translations?.map((item) => item.text);
    if (!translations || translations.length !== texts.length || translations.some((text) => typeof text !== "string")) {
      return NextResponse.json({ error: "Terjemahan gagal. Coba lagi." }, { status: 502 });
    }

    return isLegacyRequest
      ? NextResponse.json({ translation: translations[0] })
      : NextResponse.json({ translations });
  } catch (cause) {
    console.error("Translation handler failed:", cause);
    return NextResponse.json({ error: "Terjemahan gagal. Coba lagi." }, { status: 500 });
  }
}
