import type { Charity } from "@/lib/types";

export const seedCharities: Charity[] = [
  {
    id: "9f8b37f8-0de4-4328-b95d-f04f3a4f5f31",
    slug: "river-reset",
    name: "River Reset",
    location: "Austin, Texas",
    headline: "Restoring urban waterways through youth-led cleanups.",
    summary:
      "River Reset funds cleanup crews, school workshops, and weekend restoration projects around city water systems.",
    mission:
      "The charity turns every member contribution into visible, local environmental action with volunteer programs and educational events.",
    imageGradient: "from-emerald-400 via-teal-500 to-cyan-600",
    featured: true,
    tags: ["Environment", "Youth", "Community"],
    events: [
      {
        id: "river-event-1",
        title: "Spring Charity Scramble",
        location: "Barton Creek",
        date: "2026-04-19",
      },
    ],
  },
  {
    id: "9d7b0f98-d8c0-4a0e-a233-262d6ba4fd58",
    slug: "caddie-futures",
    name: "Caddie Futures",
    location: "Scottsdale, Arizona",
    headline: "Opening pathways into sport, study, and leadership.",
    summary:
      "Caddie Futures supports scholarships, mentorship, and equipment access for underrepresented young golfers.",
    mission:
      "The organization helps talented young players gain confidence, experience, and better opportunities on and off the course.",
    imageGradient: "from-amber-400 via-orange-500 to-rose-500",
    featured: true,
    tags: ["Education", "Sport", "Mentorship"],
    events: [
      {
        id: "caddie-event-1",
        title: "Scholarship Invitational",
        location: "Troon North",
        date: "2026-05-04",
      },
    ],
  },
  {
    id: "0c4d8079-24b1-4a48-96ec-1a5d25b45b42",
    slug: "hearts-on-course",
    name: "Hearts on Course",
    location: "St Andrews, Scotland",
    headline: "Creating calm, outdoor moments for families facing illness.",
    summary:
      "Hearts on Course helps families access respite retreats, counseling, and supportive community experiences.",
    mission:
      "By pairing fundraising with meaningful storytelling, the charity creates tangible emotional support for households under pressure.",
    imageGradient: "from-fuchsia-500 via-pink-500 to-orange-400",
    featured: true,
    tags: ["Health", "Families", "Wellbeing"],
    events: [
      {
        id: "heart-event-1",
        title: "Evening Impact Dinner",
        location: "Old Course Hotel",
        date: "2026-06-12",
      },
    ],
  },
];
