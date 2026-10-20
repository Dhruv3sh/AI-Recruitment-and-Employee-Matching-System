import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";

export const metadata = {
  title: "Matchwise | AI Recruitment",
  description: "AI-assisted recruitment and employee matching workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
