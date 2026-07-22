export const CATEGORIES = [
  { slug: 'developer-tools', name: 'Developer Tools', description: 'CLIs, frameworks, databases, and more' },
  { slug: 'ai-ml', name: 'AI / Machine Learning', description: 'AI tools, models, and ML-powered products' },
  { slug: 'saas-business', name: 'SaaS & Business', description: 'Business software and enterprise tools' },
  { slug: 'design-creative', name: 'Design & Creative', description: 'Design tools, icons, templates, and creative assets' },
  { slug: 'productivity', name: 'Productivity', description: 'Tools that help you get things done' },
  { slug: 'mobile-apps', name: 'Mobile Apps', description: 'iOS and Android applications' },
  { slug: 'marketing-growth', name: 'Marketing & Growth', description: 'Marketing tools, SEO, and growth hacking' },
  { slug: 'finance-fintech', name: 'Finance & Fintech', description: 'Payments, banking, investing, and financial tools' },
  { slug: 'education', name: 'Education', description: 'Learning platforms, courses, and educational tools' },
  { slug: 'entertainment-media', name: 'Entertainment & Media', description: 'Content, streaming, gaming, and media' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']
