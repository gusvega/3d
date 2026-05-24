import "./globals.css";

export const metadata = {
  title: {
    default: "Gus 3D",
    template: "%s | Gus 3D",
  },
  description: "Interactive 3D sketches by Gus Vega.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
