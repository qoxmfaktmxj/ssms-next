type LegacyPlaceholderPageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function LegacyPlaceholderPage({ params }: LegacyPlaceholderPageProps) {
  const { slug } = await params;
  const legacyPath = `/${slug.join("/")}`;

  return (
    <section className="panel">
      <h2>레거시 경로 안내</h2>
      <p>이 메뉴 경로는 레거시 Vue 앱에 존재하며 아직 마이그레이션되지 않았습니다.</p>
      <dl className="kv-grid single">
        <div>
          <dt>레거시 경로</dt>
          <dd>{legacyPath}</dd>
        </div>
      </dl>
      <p className="subtle">
        마이그레이션 백로그에서 이 화면을 추적하고 실제 Next.js
        페이지로 교체하세요.
      </p>
    </section>
  );
}

