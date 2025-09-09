/**
 * Generate a URL-safe slug from a username
 * @param username - The username to convert to a slug
 * @returns A URL-safe slug
 */
export function generateSlug(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

/**
 * Generate a unique slug by appending a number if needed
 * @param username - The username to convert to a slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique URL-safe slug
 */
export function generateUniqueSlug(username: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(username);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}



