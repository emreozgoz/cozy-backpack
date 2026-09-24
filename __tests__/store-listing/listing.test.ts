import listing from '../../store/listing.json';

// App Store Connect limits. Keywords are limited in *bytes* (Turkish letters
// such as ç, ğ, ş, ı take two), everything else in characters.
const LIMITS = { name: 30, subtitle: 30, promotionalText: 170, description: 4000, whatsNew: 4000 } as const;

describe.each(['tr', 'en'] as const)('%s App Store listing', (lang) => {
  const l = listing[lang];

  it.each(Object.entries(LIMITS))('%s fits', (field, max) => {
    expect([...((l as Record<string, unknown>)[field] as string)].length).toBeLessThanOrEqual(max);
  });

  it('keywords fit in 100 bytes, comma separated without spaces or repeats of the name', () => {
    expect(Buffer.byteLength(l.keywords, 'utf8')).toBeLessThanOrEqual(100);
    expect(l.keywords).not.toMatch(/,\s|\s,/);
    const words = l.keywords.split(',');
    expect(new Set(words).size).toBe(words.length);
    expect(words).not.toContain('cozy backpack');
  });

  it('has a caption for each of the 6 screenshots, short enough to read at a glance', () => {
    expect(l.screenshots).toHaveLength(6);
    for (const c of l.screenshots) {
      expect([...c].length).toBeLessThanOrEqual(34);
      // captions are set in Nunito, which has no emoji glyphs
      expect(c).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
