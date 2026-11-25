import { directory } from '../../lib/achievement-directory';

export function GET() {
  return Response.json(directory.map(({ slug, enLabel, zhLabel, years }) => ({
    slug, enLabel, zhLabel,
    items: years.flatMap(({ year, items }) => items.map(({ id, title, authors, venue, amount }) => ({
      id, year, title, detail: [authors, venue, amount].filter(Boolean).join(' '),
    }))),
  })));
}
