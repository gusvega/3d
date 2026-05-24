import Link from "next/link";
import FerrofluidScene from "@/components/FerrofluidScene";

export const metadata = {
  title: "Ferrofluid",
  description: "Audio-reactive ferrofluid 3D sketch.",
};

export default function FerrofluidPage() {
  return (
    <main className="experience-page">
      <FerrofluidScene />
      <Link className="back-link" href="/" aria-label="Back to sketch index">
        Index
      </Link>
    </main>
  );
}
