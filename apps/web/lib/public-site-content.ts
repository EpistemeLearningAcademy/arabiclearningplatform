export type PublicNavItem = {
  label: string;
  href: string;
};

export const publicNavigation: readonly PublicNavItem[] = [
  { label: "Home", href: "/school" },
  { label: "About", href: "/school/about" },
  { label: "Academics", href: "/school/academics" },
  { label: "Preschool", href: "/school/preschool" },
  { label: "Primary", href: "/school/primary" },
  { label: "Secondary", href: "/school/secondary" },
  { label: "Admissions", href: "/school/admissions" },
  { label: "School Life", href: "/school/life" },
  { label: "News", href: "/school/news" },
  { label: "Events", href: "/school/events" },
  { label: "Contact", href: "/school/contact" },
  { label: "Portal", href: "/" },
];

export type PublicContentSection = {
  eyebrow?: string;
  title: string;
  body: string;
  points?: readonly string[];
};

export type PublicPageData = {
  title: string;
  description: string;
  intro: string;
  kind: "editorial" | "program" | "admissions" | "stories" | "news" | "events" | "contact";
  sections: readonly PublicContentSection[];
};

export const learningCommunities = [
  {
    label: "Preschool",
    href: "/school/preschool",
    note: "Early learning and foundational development.",
  },
  {
    label: "Primary",
    href: "/school/primary",
    note: "Strong foundations for curious, confident learners.",
  },
  {
    label: "Secondary",
    href: "/school/secondary",
    note: "Deeper study, independent thought and future opportunity.",
  },
] as const;

export const publicPages: Record<string, PublicPageData> = {
  about: {
    title: "About Greenfield",
    description: "Learn about Greenfield Schools, our educational purpose and community.",
    intro:
      "Greenfield Schools brings preschool, primary and secondary learning together in one school community. We support learners as they build knowledge, confidence and the ability to contribute.",
    kind: "editorial",
    sections: [
      {
        eyebrow: "Our purpose",
        title: "Learning for growth and contribution.",
        body: "Education develops more than subject knowledge. It gives learners opportunities to ask questions, express ideas, practise discipline and take responsibility for their growth.",
      },
      {
        eyebrow: "Our approach",
        title: "Academic learning, character and creativity.",
        body: "Greenfield's learning experience brings academic development together with communication, creativity, leadership and care for the community around us.",
      },
      {
        eyebrow: "Our community",
        title: "One school, many learning journeys.",
        body: "Learners, families and staff each take part in school life in different ways. Our shared purpose is to help every learner keep moving forward.",
      },
    ],
  },
  academics: {
    title: "Academics",
    description: "Explore the Greenfield approach to teaching, learning and academic development.",
    intro:
      "Learning at Greenfield is built through purposeful teaching, steady practice and the confidence to explore new ideas. Academic development continues across Preschool, Primary and Secondary.",
    kind: "editorial",
    sections: [
      {
        eyebrow: "Teaching and learning",
        title: "Knowledge grows through curiosity and practice.",
        body: "Learners build understanding by engaging with ideas, asking questions, communicating what they know and applying learning in new contexts.",
        points: ["Curriculum and subject learning", "Communication and critical thinking", "Creativity and technology", "Leadership and responsibility"],
      },
      {
        eyebrow: "A connected journey",
        title: "Three communities, continuing growth.",
        body: "Each learning community has its own needs and opportunities, with a shared focus on developing capability, confidence and a lasting interest in learning.",
      },
    ],
  },
  preschool: {
    title: "Preschool",
    description: "Discover the early learning experience at Greenfield Schools.",
    intro:
      "The early years are a time of discovery. Preschool learning makes room for language, movement, play, creativity and the first steps in literacy and numeracy.",
    kind: "program",
    sections: [
      {
        eyebrow: "Early learning",
        title: "A secure start for curiosity and confidence.",
        body: "Children learn through interaction, exploration and guided experiences that support communication, social development and growing independence.",
      },
      {
        eyebrow: "Foundations",
        title: "Building skills through meaningful experiences.",
        body: "Early literacy, numeracy, creativity and conversation are introduced in ways that connect with children's developing understanding of the world.",
        points: ["Language and early literacy", "Number awareness", "Creative expression", "Relationships and social development"],
      },
    ],
  },
  primary: {
    title: "Primary",
    description: "Explore the Primary learning experience at Greenfield Schools.",
    intro:
      "Primary learning strengthens the foundations children need to keep asking questions, sharing ideas and approaching new challenges with confidence.",
    kind: "program",
    sections: [
      {
        eyebrow: "Growing understanding",
        title: "Strong foundations, wider horizons.",
        body: "Learners develop literacy, numeracy and scientific understanding while exploring creative work, communication and independent learning.",
      },
      {
        eyebrow: "Learning together",
        title: "Practice, participation and progress.",
        body: "Thoughtful practice and opportunities to explain ideas help learners develop knowledge, confidence and responsibility for their learning.",
        points: ["Literacy and communication", "Numeracy and problem solving", "Science and exploration", "Creative and independent learning"],
      },
    ],
  },
  secondary: {
    title: "Secondary",
    description: "Explore academic development and learning in the Greenfield Secondary community.",
    intro:
      "Secondary learning invites students to deepen subject knowledge, weigh evidence, communicate clearly and take greater ownership of their development.",
    kind: "program",
    sections: [
      {
        eyebrow: "Deeper learning",
        title: "Subject depth with room to think independently.",
        body: "Students develop understanding across their studies while practising critical thinking, communication and the thoughtful use of technology.",
      },
      {
        eyebrow: "Looking ahead",
        title: "Capability for the opportunities beyond school.",
        body: "Learning supports students as they develop interests, make informed choices and prepare for future study and contribution.",
        points: ["Subject knowledge and inquiry", "Critical thinking and communication", "Technology and creativity", "Leadership and future readiness"],
      },
    ],
  },
  admissions: {
    title: "Admissions",
    description: "Learn about the parent-facing admissions journey at Greenfield Schools.",
    intro:
      "Choosing a school is an important decision. The admissions journey is an opportunity for families to learn about Greenfield and for the school to understand each learner's needs.",
    kind: "admissions",
    sections: [
      {
        eyebrow: "Getting started",
        title: "A clear conversation, followed by considered steps.",
        body: "Families can begin by learning about the school and making an enquiry. The admissions team can then explain the relevant application and review steps for the learning community.",
      },
    ],
  },
  life: {
    title: "School Life",
    description: "Stories and experiences from the Greenfield Schools community.",
    intro:
      "School life is shaped by learning together, creative work, friendships, participation and the experiences learners carry with them.",
    kind: "stories",
    sections: [
      {
        eyebrow: "From the community",
        title: "Everyday moments are part of learning.",
        body: "This space is prepared for school stories and photography when approved editorial content is available.",
      },
    ],
  },
  news: {
    title: "News",
    description: "News and updates from Greenfield Schools.",
    intro: "School updates and published stories will appear here.",
    kind: "news",
    sections: [],
  },
  events: {
    title: "Events",
    description: "Upcoming events and dates from Greenfield Schools.",
    intro: "Published school events and dates will appear here.",
    kind: "events",
    sections: [],
  },
  contact: {
    title: "Contact Greenfield",
    description: "Contact information for Greenfield Schools.",
    intro: "Contact details will be published here when approved school information is available.",
    kind: "contact",
    sections: [
      {
        title: "Speak with the school",
        body: "Greenfield's public contact details have not been provided in the platform content yet. We have left this space ready for approved contact channels.",
      },
    ],
  },
};

export type PublishedStory = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  content: readonly { type: "paragraph" | "heading"; text: string }[];
  image?: { src: string; alt: string };
};

export type PublishedEvent = {
  slug: string;
  title: string;
  summary: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  details?: readonly string[];
};

export const publishedStories: readonly PublishedStory[] = [];
export const publishedEvents: readonly PublishedEvent[] = [];
