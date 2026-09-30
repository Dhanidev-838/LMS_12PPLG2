import { Suspense } from "react";
import KurikulumContent from "./KurikulumContent";

export default function KurikulumPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-[#94A3B8]">Memuat...</div>}>
      <KurikulumContent />
    </Suspense>
  );
}
