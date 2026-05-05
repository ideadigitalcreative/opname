"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "./toast-provider";

export function FlashToast() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const statusType = searchParams.get("statusType");
    const message = searchParams.get("message");

    if (statusType && message) {
      toast(
        statusType === "success" ? "success" : statusType === "error" ? "error" : "info",
        message,
      );

      const url = new URL(window.location.href);
      url.searchParams.delete("statusType");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, toast]);

  return null;
}
