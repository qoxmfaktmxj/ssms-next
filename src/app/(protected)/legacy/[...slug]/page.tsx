type LegacyPlaceholderPageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function LegacyPlaceholderPage({ params }: LegacyPlaceholderPageProps) {
  const { slug } = await params;
  const legacyPath = `/${slug.join("/")}`;

  return (
    <section className="panel">
      <h2>Legacy Route Placeholder</h2>
      <p>This menu path exists in the legacy Vue app and is not migrated yet.</p>
      <dl className="kv-grid single">
        <div>
          <dt>Legacy route</dt>
          <dd>{legacyPath}</dd>
        </div>
      </dl>
      <p className="subtle">
        Track this screen in the migration backlog and replace this placeholder with an actual Next.js
        page during the domain slice implementation.
      </p>
    </section>
  );
}
