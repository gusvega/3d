import { notFound, permanentRedirect } from "next/navigation";
import { About, CaseStudy } from "../../../components/rohini/Portfolio";
import { projects } from "../../../data/rohini/projects";
import pages from "../../../data/rohini/pages.json";
export function generateStaticParams() {
  return ["about", ...projects.map((p) => p.slug)].map((slug) => ({ slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return {
    title: slug === "about" ? "About" : project?.client || "Portfolio",
    alternates: { canonical: `https://3d.gusvega.dev/rohini/${slug}` },
    ...(project ? { description: project.description } : {}),
  };
}
export default async function Page({ params }) {
  const { slug } = await params;
  if (slug.endsWith(".html"))
    permanentRedirect(
      slug === "index.html" ? "/rohini" : `/rohini/${slug.slice(0, -5)}`,
    );
  if (slug === "about") return <About sections={pages.about} />;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  return <CaseStudy project={project} sections={pages[slug] || []} />;
}
