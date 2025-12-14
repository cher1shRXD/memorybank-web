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
    <html lang="en" className="h-full">
      <body
        className="antialiased h-full overflow-hidden"
      >
        <LoadingBar color="#6366f1" />
        <ModalProvider />
        <ToastContainer />
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
