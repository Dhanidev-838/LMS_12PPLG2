import { Suspense } from "react";
import LocalizedLoading from "@/components/LocalizedLoading";
import KurikulumContent from "./KurikulumContent";

export default function KurikulumPage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <KurikulumContent />
    </Suspense>
  );
}
