import "./globals.css";
import Providers from "../components/Providers";
import AppLayout from "../components/AppLayout";

export const metadata = {
  title: "JB Taxes — Operations",
  description: "Prototype — JB Taxes operations experience",
};

export const viewport = {
  themeColor: "#0b1b33",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
