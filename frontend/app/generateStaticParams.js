// This file enables static site generation for Next.js app directory
// It generates the static routes for the entire site

export async function generateStaticParams() {
  // Define the static routes to pre-render
  return [
    { slug: '' }, // Home page
    { slug: 'dashboard' },
    { slug: 'login' },
    // Add other static routes as needed
  ];
} 