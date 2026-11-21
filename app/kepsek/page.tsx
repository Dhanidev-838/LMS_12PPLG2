import { Suspense } from "react";
import LocalizedLoading from "@/components/LocalizedLoading";
import KepsekContent from "./KepsekContent";

export default function KepsekPage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <KepsekContent />
    </Suspense>
  );
}
