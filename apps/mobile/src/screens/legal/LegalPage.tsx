import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { LEGAL_DOCS, type LegalDoc } from './legalContent';

export default function LegalPage() {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: LegalDoc['slug'] }>();
  const doc = slug ? LEGAL_DOCS[slug] : undefined;

  if (!doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
        <Icon name="description" className="text-[48px] text-on-surface-variant" />
        <p className="text-body-md text-on-surface-variant">Hujjat topilmadi.</p>
        <button onClick={() => nav(-1)} className="text-primary text-body-md press">
          Orqaga
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-50 flex items-center px-margin-main h-14 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/50">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
          <Icon name="arrow_back" className="text-[24px]" />
        </button>
        <h1 className="text-title-lg font-title-lg text-on-surface ml-2">{doc.title}</h1>
      </header>

      <main className="flex-1 px-margin-main py-stack-lg flex flex-col gap-stack-lg pb-16">
        <div>
          <p className="text-label-sm font-label-sm text-on-surface-variant/70 mb-stack-sm">
            Oxirgi yangilanish: {doc.updated}
          </p>
          <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{doc.intro}</p>
        </div>

        {doc.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-stack-sm">
            <h2 className="text-title-md font-title-md text-on-surface">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
