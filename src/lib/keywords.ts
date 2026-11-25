const STOP = new Set(
  "a an the and or of to for in on with that this it is are be as by from at into your my our their i we want build building create app tool platform system using use can will should would like also more than such via based powered new simple".split(" ")
);

/** Lowercase, split on non-alphanumerics (keeping + and #), drop stopwords, lightly de-pluralise. */
export function tokenize(s: string): string[] {
  const out: string[] = [];
  for (const raw of s.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []) {
    let t = raw.replace(/^\.+|\.+$/g, "");
    if (t.length < 2 || STOP.has(t)) continue;
    if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
    out.push(t);
  }
  return out;
}

export const unique = <T,>(xs: T[]) => [...new Set(xs)];
