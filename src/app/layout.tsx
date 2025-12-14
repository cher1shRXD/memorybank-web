import { LoadingBar } from "@cher1shrxd/loading";
import { ModalProvider } from "@cher1shrxd/modal";
import { ToastContainer } from "@cher1shrxd/toast";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Bank",
  description: "똑똑한 필기 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <LoadingBar color="#6366f1" />
        <ModalProvider />
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
