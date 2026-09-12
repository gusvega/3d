import Spectra from "./spectra";
export const metadata = {
  title: "SPECTRA",
  description: "Your private stem workspace.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Spectra />;
}
