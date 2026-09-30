import { Suspense } from "react";
import KepsekContent from "./KepsekContent";

export default function KepsekPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-[#94A3B8]">Memuat...</div>}>
      <KepsekContent />
    </Suspense>
  );
}
