export const asset = (name) =>
  `/rohini/assets/images/${encodeURIComponent(name)}`;
export const resume = asset("Rohini-Resume-2021.pdf");
export const email = "mailto:mrohini07@gmail.com";
export const linkedin =
  "https://www.linkedin.com/pub/rohini-mohandoss/94/b3b/477";
export const projects = [
  {
    slug: "mcg",
    client: "MCG Health",
    title: "Clarity for the people behind better care.",
    short: "Content authoring, reimagined",
    category: "Healthcare",
    discipline: "Enterprise UX · Content strategy",
    role: "Lead UX Designer",
    image: "MCG-Banner.jpg",
    color: "#deddd7",
    protected: true,
    description:
      "Redesigning a content authoring tool for evidence-based care guidelines, helping healthcare organizations deliver informed care across the continuum of treatment.",
  },
  {
    slug: "cuemed",
    client: "CueMed",
    title: "A more thoughtful approach to everyday health.",
    short: "Making medication a little easier",
    category: "Healthcare",
    discipline: "User research · Connected products",
    role: "Lead UX Designer",
    image: "Hexis-Website.png",
    color: "#e8ded4",
    protected: true,
    description:
      "Exploring how a connected health product can support medication adherence for people living with chronic conditions.",
  },
  {
    slug: "impinj-lab",
    client: "Impinj",
    title: "Less friction. More time for engineering.",
    short: "Complex systems, clearer workflows",
    category: "Enterprise",
    discipline: "Research · Enterprise UX",
    role: "UX Designer",
    duration: "4 weeks",
    image: "Impinj-Lab-Main.jpg",
    color: "#d5e8e5",
    description:
      "A redesigned lab reservation system that helps engineers find, reserve, and manage shared RFID test equipment.",
  },
  {
    slug: "joe-coffee",
    client: "Joe Coffee",
    title: "Your neighborhood coffee, a few taps away.",
    short: "A better daily coffee ritual",
    category: "Consumer",
    discipline: "Mobile UX · Research · Prototyping",
    role: "Researcher & Designer",
    duration: "3 weeks",
    image: "Phone-background.jpg",
    color: "#e2d9c9",
    description:
      "Research, usability studies, and a mobile ordering experience designed around independent coffee shops and the people who love them.",
  },
  {
    slug: "home-depot",
    client: "The Home Depot",
    title: "Helping people say, “I can make that.”",
    short: "The confidence to do it yourself",
    category: "Consumer",
    discipline: "Concept project · Mobile UX",
    role: "Researcher & Designer",
    duration: "2 weeks",
    image: "HomeDepot-Mobile.jpg",
    color: "#eee0d0",
    description:
      "A DIY app concept to inspire, educate, and empower people through every step of their home projects.",
  },
  {
    slug: "standard-goods",
    client: "Standard Goods",
    title: "Independent style. Effortless discovery.",
    short: "A more considered shopping experience",
    category: "Consumer",
    discipline: "E-commerce · Information architecture",
    role: "Researcher & Designer",
    duration: "2 weeks",
    image: "Standard-Mac.png",
    color: "#e7e6df",
    description:
      "A boutique shopping experience reimagined with clearer product discovery, navigation, and checkout.",
  },
  {
    slug: "spitfyre",
    client: "Spitfyre",
    title: "A little language. A lot of personality.",
    short: "From idea to hackathon winner",
    category: "Experiments",
    discipline: "Hackathon winner · Product design",
    role: "Researcher & Designer",
    duration: "24 hours",
    image: "Spitfyre.png",
    color: "#e0dfeb",
    description:
      "A slang translation tool built with two developers and another designer in a 24-hour General Assembly challenge.",
  },
  {
    slug: "cdk",
    client: "CDK Global",
    title: "Digital experiences with a sense of drive.",
    short: "Design that moves with you",
    category: "Web design",
    discipline: "Responsive design · HTML & CSS",
    role: "Web Designer",
    image: "Lexus.jpg",
    color: "#eee1c3",
    description:
      "A selection of automotive websites, responsive layouts, campaigns, and visual design created at CDK Global.",
  },
];
