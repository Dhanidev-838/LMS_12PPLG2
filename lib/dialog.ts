export type DialogType = "confirm" | "alert";

type DialogDetail = {
  type: DialogType;
  message: string;
  resolve: (value: boolean) => void;
};

function request(type: DialogType, message: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(type === "alert");
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogDetail>("classify-dialog", { detail: { type, message, resolve } }));
  });
}

export function showConfirm(message: string): Promise<boolean> {
  return request("confirm", message);
}

export function showAlert(message: string): Promise<boolean> {
  return request("alert", message);
}
