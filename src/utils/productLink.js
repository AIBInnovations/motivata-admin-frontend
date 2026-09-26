const WEBSITE_URL = 'https://motivata.in';

export const slugify = (name = '') =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const productLink = (name) => `${WEBSITE_URL}/new-services?open=${slugify(name)}`;

export const eventLink = (event) => `${WEBSITE_URL}/events/${event.slug || event._id}`;
