import { ProfileSchema, type Profile } from './schemas';

const data: Profile = {
  name: 'Omhar Regidor',
  role: 'AI Engineer \\ Software Developer',
  location: 'Batangas, Philippines',
  photoSrc: '/omhar/me-pro-image-crop.jpg',
  bioParagraphs: [
    'Omhar Regidor is a Software Developer and emerging AI Engineer building systems that combine software, automation, and AI-driven workflows. He focuses on scalable digital solutions that help startups and MSMEs operate more efficiently and grow faster.',
    'Beyond traditional web development, he is deeply interested in autonomous systems and AI-powered execution — exploring how intelligent agents, automation pipelines, and scalable infrastructures can transform business operations. His mindset bridges engineering and business growth.',
    'Currently, he is evolving from developer into a systems-oriented technical leader — sharpening his skills in software architecture, AI-assisted development, and business systems design. His long-term vision: build impactful products, lead engineering teams, and create scalable AI-powered ecosystems.',
  ],
  socials: [
    { label: 'GitHub', url: 'https://github.com/OmharRegidor' },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/omhar-regidor-84827136a/',
    },
    {
      label: 'Facebook',
      url: 'https://www.facebook.com/christian.omhar.regidor',
    },
  ],
  calendlyUrl: 'https://calendly.com/omharregidor/30min',
  // The live site's contact path. Every call to action opens a WhatsApp chat with this greeting filled in.
  whatsappUrl: 'https://wa.me/639506009518?text=Hi%20Omhar%2C%20I%20saw%20your%20portfolio%20and%20want%20to%20talk%20about%20a%20project.',
  email: 'omharregidor@gmail.com',
  phone: '+639506009518',
  // Featured awards intentionally empty — the rotator hides at length<=1.
  // Add real awards (hackathon wins, cert honors, etc.) here when they land.
  featuredAwards: [],
};

export const profile = ProfileSchema.parse(data);
