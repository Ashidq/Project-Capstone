import type { ReactNode } from "react";
import Footer from "@/src/components/layout/Footer";
import Header from "@/src/components/layout/Header";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">

          {/* HEADER */}
          <Header />

          {/* CONTENT */}
          <main className="grow">
            {children}
          </main>

          {/* FOOTER */}
          <Footer />

        </div>
      </body>
    </html>
  );
}