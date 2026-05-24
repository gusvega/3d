import Link from "next/link";
import GusScene from "@/components/GusScene";

export const metadata = {
  title: "GUS",
  description: "Interactive glossy 3D Gus wordmark.",
};

export default function GusPage() {
  return (
    <main className="experience-page">
      <GusScene />
      <Link className="back-link" href="/" aria-label="Back to sketch index">
        Index
      </Link>
    </main>
  );
}
