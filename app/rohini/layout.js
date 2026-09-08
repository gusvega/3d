import "./gus-ui.css";
import "./rohini.css";
import { PortfolioShell } from "../../components/rohini/Portfolio";
export const metadata = {
  title: {
    default: "Rohini Mohandoss — Lead UX/UI Designer",
    template: "%s — Rohini Mohandoss",
  },
  description:
    "Thoughtful digital experiences, designed around people. Explore UX research, product design, and case studies by Rohini Mohandoss.",
  alternates: { canonical: "https://3d.gusvega.dev/rohini" },
  openGraph: {
    title: "Rohini Mohandoss — Design that feels human",
    description:
      "UX research, product design, and thoughtful digital experiences.",
    url: "https://3d.gusvega.dev/rohini",
    images: [
      { url: "https://3d.gusvega.dev/rohini/assets/images/MCG-Banner.jpg" },
    ],
  },
};
export default function RohiniLayout({ children }) {
  return <PortfolioShell>{children}</PortfolioShell>;
}
