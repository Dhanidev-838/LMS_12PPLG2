"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";

type DialogDetail = {
  type: "confirm" | "alert";
  message: string;
  resolve: (value: boolean) => void;
};

export default function DialogHost() {
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
      title={dialog?.type === "confirm" ? "Konfirmasi" : "Informasi"}
      dismissible={dialog?.type === "confirm"}
    >
      <div className="space-y-5">
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{dialog?.message}</p>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          {dialog?.type === "confirm" && (
            <Button variant="outline" onClick={() => close(false)}>
              Batal
            </Button>
          )}
          <Button variant={dialog?.type === "confirm" ? "danger" : "primary"} onClick={() => close(true)}>
            {dialog?.type === "confirm" ? "Lanjutkan" : "Mengerti"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
