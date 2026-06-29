import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';

interface Props {
  title: string;
  subtitle?: string;
  /** Bo'lsa, "Davom etish" tugmasi shu manzilga o'tadi */
  next?: string;
}

/** Hali qurilmagan ekranlar uchun vaqtinchalik joy egasi. */
export default function Placeholder({ title, subtitle, next }: Props) {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-margin-main text-center gap-stack-md">
      <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
        <Icon name="construction" className="text-[40px]" />
      </div>
      <div className="space-y-stack-sm">
        <h1 className="text-headline-md font-headline-md text-on-surface">{title}</h1>
        {subtitle && <p className="text-body-md font-body-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {next && (
        <button
          onClick={() => nav(next)}
          className="mt-stack-md h-[52px] px-8 rounded-button bg-primary text-on-primary text-body-lg font-body-lg press shadow-ambient"
        >
          Davom etish
        </button>
      )}
    </div>
  );
}
