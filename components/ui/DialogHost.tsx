"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { useLanguage } from "@/lib/i18n";

type DialogDetail = {
  type: "confirm" | "alert";
  message: string;
  resolve: (value: boolean) => void;
};

export default function DialogHost() {
  const { t } = useLanguage();
  const [dialog, setDialog] = useState<DialogDetail | null>(null);

  useEffect(() => {
    function handleDialog(event: Event) {
      const detail = (event as CustomEvent<DialogDetail>).detail;
      setDialog(detail);
    }

    window.addEventListener("classify-dialog", handleDialog);
    return () => window.removeEventListener("classify-dialog", handleDialog);
  }, []);

  function close(result: boolean) {
    dialog?.resolve(result);
    setDialog(null);
  }

  return (
    <Modal
      open={Boolean(dialog)}
      onClose={() => close(false)}
      title={t(dialog?.type === "confirm" ? "Konfirmasi" : "Informasi")}
      dismissible={dialog?.type === "confirm"}
    >
      <div className="space-y-5">
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{dialog?.message ? t(dialog.message) : null}</p>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          {dialog?.type === "confirm" && (
            <Button variant="outline" onClick={() => close(false)}>
              {t("Batal")}
            </Button>
          )}
          <Button variant={dialog?.type === "confirm" ? "danger" : "primary"} onClick={() => close(true)}>
            {t(dialog?.type === "confirm" ? "Lanjutkan" : "Mengerti")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
