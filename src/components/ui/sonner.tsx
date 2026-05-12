"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans text-[13px] shadow-lg rounded-xl border px-4 py-3 gap-2.5 items-start",
          title: "font-semibold text-[13px]",
          description: "text-[12px] opacity-80",
          success:
            "bg-white border-[#8aaad8] text-[#071a45] [&>[data-icon]]:text-[#1a3d8f]",
          error:
            "bg-white border-red-200 text-red-900 [&>[data-icon]]:text-red-500",
          warning:
            "bg-white border-amber-200 text-amber-900 [&>[data-icon]]:text-amber-500",
          info:
            "bg-white border-blue-200 text-blue-900 [&>[data-icon]]:text-blue-500",
          closeButton:
            "rounded-lg border-neutral-200 bg-white text-neutral-400 hover:text-neutral-700",
        },
      }}
      style={{ "--offset": "16px" } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };

