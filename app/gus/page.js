import Link from "next/link";
import GusScene from "@/components/GusScene";

export const metadata = {
  title: "GUS",
  description:
    "GUS in pearl, silver, and smoked glass: original artwork and interactive 3D studies.",
};

export default function GusPage() {
  return (
    <main className="experience-page gus-page">
      <GusScene />
      <Link className="back-link" href="/" aria-label="Back to sketch index">
        Index
      </Link>
    </main>
  );
}
