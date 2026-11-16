export type Project = {
  slug: string;
  level: string;
  title: string;
  tagline: string;
  summary: string;
  role: string;
  stack: string[];
  status: string;
  url: string;
  urlLabel: string;
  cover: 'ration' | 'reconned' | 'fedora' | 'v1';
  body: { heading: string; text: string }[];
  next: string;
};

export const site = {
  name: 'Safet Pojskić',
  wordmark: "SAFET'S QUEST",
  role: 'Software Engineer',
  heroLine: 'Works across the stack, cares most about the front end.',
  currentRole: 'Software Engineer @ HTEC Group',
  location: 'Zenica, Bosnia and Herzegovina',
  email: 'pm@safetpojskic.com',
  url: 'https://safetpojskic.com',
  description:
    'Safet Pojskić is a software engineer in Zenica, BiH. Frontend-leaning full-stack developer, currently at HTEC Group, previously tech lead at Pickleball.com.',
  socials: [
    { label: 'GitHub', href: 'https://github.com/spojskic' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/mrpojskic' },
    { label: 'Website', href: 'https://safetpojskic.com' },
  ],
};

export const about = {
  heading: 'The class change',
  paragraphs: [
    "I started out in pharmacy: technician school, then pharmacy faculty. Somewhere between semesters I met code, and it stuck. In 2022 I changed class and joined Atlantbh as an intern, and I have been leveling up as a software engineer ever since.",
    "Four years later I have built enterprise apps, led a frontend team, and shipped products people use every day. I work across the stack, but I care most about the front end, where craft is visible.",
  ],
  facts: [
    { label: 'CLASS', value: 'Software Engineer' },
    { label: 'GUILD', value: 'HTEC Group' },
    { label: 'BASE', value: 'Zenica, BiH' },
    { label: 'SINCE', value: '2022' },
  ],
};

export const skills: { group: string; icon: string; items: string[] }[] = [
  { group: 'Languages', icon: 'blade', items: ['TypeScript', 'Java', 'SQL'] },
  { group: 'Frameworks', icon: 'shield', items: ['React', 'Next.js', 'Node.js'] },
  { group: 'Tools', icon: 'potion', items: ['Git', 'Docker', 'PostgreSQL', 'Prisma', 'Stripe'] },
];

export const quests: Project[] = [
  {
    slug: 'ration',
    level: 'WORLD 2-1',
    title: 'Ration',
    tagline: 'Open-source calorie & nutrient tracker for web, iOS and Android',
    summary: 'A nutrition tracker for a small group of friends: calories, macros and about 90 nutrients, private by design, with optional AI that runs on your own key.',
    role: 'Creator & Engineer',
    stack: ['Expo', 'React Native', 'TypeScript', 'Supabase'],
    status: 'OPEN SOURCE',
    url: 'https://ration.safetpojskic.com',
    urlLabel: 'ration.safetpojskic.com',
    cover: 'ration',
    body: [
      {
        heading: 'Context',
        text: 'Calorie apps are ad-driven and put your data in someone else\'s cloud. I wanted one for myself and a small group of friends: invite-only, self-hostable, and honest about nutrition instead of gamifying it.',
      },
      {
        heading: 'Idea',
        text: 'One open-source tracker spanning web, iOS and Android, private by design. Every account is invite-only with per-user row-level security, and the optional AI features (photo log, describe a meal, recipe drafts, a health-only coach) run on your own OpenRouter key, which never leaves the device.',
      },
      {
        heading: 'Craft',
        text: 'An Expo and React Native app with a Supabase backend. The food database is built from USDA FoodData Central, about 14,000 generic foods with full micronutrients, plus the Canadian Nutrient File, barcode lookup and custom foods and recipes. Daily targets come from BMR formulas, activity level and goal; Apple Health and Health Connect sync adds what you actually burned. Features are tested in isolation, including a browser smoke-test harness, before first contact with a live backend.',
      },
      {
        heading: 'Outcome',
        text: 'Open source at github.com/spojskic/ration-calorie-tracker and running at ration.safetpojskic.com entirely on free tiers. All planned features are written and tested; the first run against a real backend and phones is the next quest.',
      },
    ],
    next: 'reconned',
  },
  {
    slug: 'reconned',
    level: 'WORLD 2-2',
    title: 'Reconned.com',
    tagline: 'Airsoft event & club management platform',
    summary: 'A platform that moves airsoft club operations out of spreadsheets and group chats: clubs, members and events in one place.',
    role: 'Founder & Engineer',
    stack: ['Next.js', 'Prisma', 'PostgreSQL'],
    status: 'LIVE',
    url: 'https://reconned.com',
    urlLabel: 'reconned.com',
    cover: 'reconned',
    body: [
      {
        heading: 'Context',
        text: 'Airsoft clubs run on spreadsheets, group chats and manual sign-ups. Organizers track members and events by hand, so the experience suffers on both sides: organizers drown in admin, players miss events.',
      },
      {
        heading: 'Idea',
        text: 'One platform where the club, its members and its events live together. Member management, club operations and event organization share the same data, so signing up for an event is one action instead of five messages.',
      },
      {
        heading: 'Craft',
        text: 'Next.js on the frontend and API, Prisma as the data layer, PostgreSQL underneath. The domain model centers on clubs and events, which keeps features like member roles and event registration straightforward to extend.',
      },
      {
        heading: 'Outcome',
        text: 'Reconned is live at reconned.com and used by real clubs and airsoft players. It streamlines club operations, member management and event organization end to end.',
      },
    ],
    next: 'fedora-portfolio',
  },
  {
    slug: 'fedora-portfolio',
    level: 'WORLD 2-3',
    title: 'The Fedora Portfolio',
    tagline: 'A Fedora KDE desktop simulation, in the browser',
    summary: 'A portfolio built as an interactive Fedora KDE Plasma desktop, explored through a working Linux terminal. The proof that the site itself is the work.',
    role: 'Designer & Engineer',
    stack: ['React', 'Vite', 'TypeScript', 'Bun'],
    status: 'LIVE',
    url: 'https://safetpojskic.com',
    urlLabel: 'safetpojskic.com',
    cover: 'fedora',
    body: [
      {
        heading: 'Context',
        text: 'A portfolio has to prove skill fast. A template says nothing, so the site itself had to be the demo: something a visitor can poke at and feel the engineering behind it.',
      },
      {
        heading: 'Idea',
        text: 'An entire Fedora KDE Plasma desktop in the browser. Icons, windows, a taskbar and a kick-off menu, plus a real terminal you can type commands into to explore my experience, skills and projects.',
      },
      {
        heading: 'Craft',
        text: 'React and TypeScript on Vite, run with Bun. The interesting part is the window manager: draggable, resizable, focusable windows with z-ordering, plus working apps like a file manager, a text editor, Minesweeper, and the terminal.',
      },
      {
        heading: 'Outcome',
        text: 'Live at safetpojskic.com. It replaced my first portfolio and became the reference people mention when they get in touch, which is the best signal a portfolio can give.',
      },
    ],
    next: 'portfolio-v1',
  },
  {
    slug: 'portfolio-v1',
    level: 'WORLD 2-4',
    title: 'Portfolio V1',
    tagline: 'Animated Next.js portfolio with live Trakt.tv integration',
    summary: 'A dark-mode-first personal portfolio with an animated hero, scroll-parallax gallery, experience timeline, and a live section streaming what I was actually watching.',
    role: 'Designer & Engineer',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    status: 'ARCHIVED',
    url: 'https://old.safetpojskic.com/',
    urlLabel: 'old.safetpojskic.com',
    cover: 'v1',
    body: [
      {
        heading: 'Context',
        text: 'My first portfolio. I wanted it to move, and I wanted a reason for server-side rendering beyond boilerplate examples.',
      },
      {
        heading: 'Idea',
        text: 'Dark-mode-first, with an animated hero, a scroll-parallax project gallery and an experience timeline. The signature: a live "What I\'m Watching" section streaming my real watch history through server components.',
      },
      {
        heading: 'Craft',
        text: 'Next.js 14 with TypeScript and Tailwind CSS, Framer Motion for the hero and parallax. The Trakt.tv integration fetched real watch history server-side, so the page rendered with live data on every request.',
      },
      {
        heading: 'Outcome',
        text: 'It served for years at safetpojskic.com and is archived at old.safetpojskic.com. Building it taught me motion discipline, which the Fedora portfolio later pushed much further.',
      },
    ],
    next: 'ration',
  },
];

export const log = [
  {
    company: 'HTEC Group',
    role: 'Software Engineer',
    period: 'May 2025 to now',
    status: 'active',
    bullets: [
      'Building a large collaborative web app with real-time editing and rich canvas-driven interactions.',
      'Cross-platform features in React and TypeScript, with Swift compiled to WebAssembly to keep performance fast.',
    ],
  },
  {
    company: 'Pickleball.com',
    role: 'Software Engineer, Frontend Tech Lead',
    period: 'Jan 2024 to May 2025',
    status: 'done',
    bullets: [
      'Architected enterprise web applications on Next.js 15, React 19 and TypeScript, including a complex subscription platform with Stripe.',
      'Led the frontend team: architecture, code review, sprint planning and stakeholder management, while still shipping core features.',
    ],
  },
  {
    company: 'Atlantbh',
    role: 'Junior Software Engineer',
    period: 'Jun 2022 to Jan 2024',
    status: 'done',
    sub: {
      role: 'Full Stack Development Internship',
      period: 'Feb 2022 to May 2022',
      bullets: [
        'Full-stack applications with React and Spring Boot.',
        'Git, Maven, JUnit, design patterns and MVC architecture.',
      ],
    },
    bullets: [
      'Full-stack enterprise applications with React, PostgreSQL and Docker.',
      'Code reviews and mentorship of two IT college students.',
    ],
  },
  {
    company: 'BH Futures Foundation',
    role: 'Alumni & Mentor',
    period: 'Sep 2021 to now',
    status: 'side',
    bullets: [
      'Mentoring high school students in soft skills, career planning and decisions.',
      'Volunteered on the web team that built the fls.ba info website.',
    ],
  },
];

export const training = [
  { school: 'University of Zenica, Polytechnical Faculty', field: 'Software Engineering', period: '2019 to now' },
  { school: 'Pharmacy Faculty, Travnik', field: 'Pharmacy', period: '2014 to 2016' },
  { school: 'JU Srednja Medicinska Škola', field: 'Pharmacy Technician', period: '2010 to 2014' },
];

export const byslug = (slug: string) => quests.find((q) => q.slug === slug);
