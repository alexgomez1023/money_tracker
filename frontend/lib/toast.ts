export type ToastKind = "success" | "error";

export type ToastDetail = {
  text: string;
  kind: ToastKind;
};

export const TOAST_EVENT = "toast";

// Shows a short message at the bottom of the screen. The Toaster in the root layout listens for it.
export function showToast(text: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: { text, kind },
    })
  );
}
