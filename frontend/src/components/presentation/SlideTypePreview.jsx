import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Play, MapPin, BookOpen, GripVertical, Check } from 'lucide-react';

const BARS = [
  { width: '92%', color: 'var(--color-primary)' },
  { width: '68%', color: 'var(--color-accent-purple-deep)' },
  { width: '46%', color: 'var(--color-accent-sky)' },
  { width: '28%', color: 'var(--color-accent-teal)' },
];

const BarsPreview = ({ withCheck = false }) => (
  <div className="w-full max-w-sm space-y-3">
    {BARS.map((bar, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className="flex-1 h-7 rounded-md bg-canvas-soft overflow-hidden">
          <div
            className="h-full rounded-md flex items-center justify-end px-2"
            style={{ width: bar.width, backgroundColor: bar.color }}
          >
            {withCheck && i === 0 && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const WordCloudPreview = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 max-w-sm">
    <span className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>creative</span>
    <span className="text-lg font-semibold text-ink-muted">bold</span>
    <span className="text-xl font-semibold" style={{ color: 'var(--color-accent-teal)' }}>curious</span>
    <span className="text-sm font-medium text-ink-faint">honest</span>
    <span className="text-2xl font-semibold" style={{ color: 'var(--color-accent-purple-deep)' }}>focused</span>
    <span className="text-sm font-medium text-ink-faint">calm</span>
  </div>
);

const BubblesPreview = () => (
  <div className="w-full max-w-sm space-y-2">
    <div className="h-6 rounded-full bg-canvas-soft w-full" />
    <div className="h-6 rounded-full bg-canvas-soft w-4/5 ml-auto" />
    <div className="h-6 rounded-full bg-canvas-soft w-3/5" />
  </div>
);

const ScalePreview = () => (
  <div className="w-full max-w-sm">
    <div className="relative h-2 rounded-full bg-canvas-soft">
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '62%', backgroundColor: 'var(--color-primary)' }} />
      <div
        className="absolute top-1/2 h-4 w-4 rounded-full bg-surface border-2 shadow-[var(--shadow-level-1)] -translate-y-1/2"
        style={{ left: 'calc(62% - 8px)', borderColor: 'var(--color-primary)' }}
      />
    </div>
    <div className="flex justify-between mt-2 text-[11px] text-ink-faint">
      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
    </div>
  </div>
);

const RankingPreview = () => (
  <div className="w-full max-w-sm space-y-2">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center gap-2 h-9 rounded-md border border-hairline bg-surface px-2.5">
        <span className="text-xs font-semibold text-ink-faint w-3">{i + 1}</span>
        <div
          className="h-2 rounded-full flex-1"
          style={{
            width: `${80 - i * 20}%`,
            backgroundColor: ['var(--color-primary)', 'var(--color-accent-teal)', 'var(--color-accent-sky)'][i],
          }}
        />
        <GripVertical className="h-3.5 w-3.5 text-ink-faint shrink-0" />
      </div>
    ))}
  </div>
);

const BellCurvePreview = () => (
  <div className="w-full max-w-sm flex flex-col items-center gap-3">
    <div className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-sm font-semibold text-ink shadow-[var(--shadow-level-1)]">
      <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-accent-green)' }} />
      7
    </div>
    <svg viewBox="0 0 200 70" className="w-full h-16" preserveAspectRatio="none">
      <path
        d="M0,68 C40,68 55,4 100,4 C145,4 160,68 200,68"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        opacity="0.55"
      />
    </svg>
    <div className="relative w-full h-1.5 rounded-full bg-canvas-soft">
      <div
        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 rounded-sm"
        style={{ left: '68%', backgroundColor: 'var(--color-primary)' }}
      />
    </div>
  </div>
);

const PointsPreview = () => (
  <div className="grid grid-cols-10 gap-1 max-w-[200px]">
    {Array.from({ length: 40 }).map((_, i) => (
      <span
        key={i}
        className="h-3.5 w-3.5 rounded-sm"
        style={{ backgroundColor: i < 27 ? 'var(--color-primary)' : 'var(--color-canvas-soft)' }}
      />
    ))}
  </div>
);

const GridPreview = () => (
  <div className="relative w-40 h-40 border border-hairline rounded-md bg-canvas-soft/60">
    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-ink-faint" />
    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-ink-faint" />
    <span
      className="absolute h-3 w-3 rounded-full border-2 border-surface shadow-[var(--shadow-level-1)]"
      style={{ left: '32%', top: '28%', backgroundColor: 'var(--color-primary)' }}
    />
  </div>
);

const PinPreview = () => (
  <div className="relative w-full max-w-sm h-32 rounded-lg bg-canvas-soft overflow-hidden flex items-center justify-center">
    <ImageIcon className="h-8 w-8 text-ink-faint" />
    <MapPin className="absolute h-6 w-6 fill-current" style={{ color: 'var(--color-accent-pink)', left: '58%', top: '32%' }} />
  </div>
);

const MediaPreview = (props) => {
  const Icon = props.icon;
  return (
    <div className="w-full max-w-sm h-32 rounded-lg bg-canvas-soft flex items-center justify-center">
      <Icon className="h-8 w-8 text-ink-faint" />
    </div>
  );
};

const TextPreview = () => (
  <div className="w-full max-w-sm space-y-2.5">
    <div className="h-4 rounded bg-canvas-soft w-3/4 mx-auto" />
    <div className="h-3 rounded bg-canvas-soft w-1/2 mx-auto" />
  </div>
);

const InstructionPreview = () => (
  <div className="w-full max-w-sm space-y-2">
    <BookOpen className="h-6 w-6 text-ink-faint mx-auto mb-1" />
    <div className="h-2.5 rounded bg-canvas-soft w-full" />
    <div className="h-2.5 rounded bg-canvas-soft w-5/6 mx-auto" />
    <div className="h-2.5 rounded bg-canvas-soft w-2/3 mx-auto" />
  </div>
);

const ImportPreview = (props) => {
  const Icon = props.icon;
  return (
    <div className="w-full max-w-sm h-32 rounded-lg border-2 border-dashed border-hairline flex items-center justify-center">
      <Icon className="h-8 w-8 text-ink-faint" />
    </div>
  );
};

const PREVIEW_BODY = {
  text: () => <TextPreview />,
  image: () => <MediaPreview icon={ImageIcon} />,
  video: () => <MediaPreview icon={Play} />,
  instruction: () => <InstructionPreview />,
  multiple_choice: () => <BarsPreview />,
  quiz: () => <BarsPreview withCheck />,
  word_cloud: () => <WordCloudPreview />,
  open_ended: () => <BubblesPreview />,
  scales: () => <ScalePreview />,
  ranking: () => <RankingPreview />,
  qna: () => <BubblesPreview />,
  guess_number: () => <BellCurvePreview />,
  hundred_points: () => <PointsPreview />,
  '2x2_grid': () => <GridPreview />,
  pin_on_image: () => <PinPreview />,
  pick_answer: () => <BarsPreview withCheck />,
  type_answer: () => <BubblesPreview />,
};

const IMPORT_TYPES = new Set(['miro', 'powerpoint', 'google_slides', 'pdf']);

const SlideTypePreview = ({ type, label, icon: Icon }) => {
  const { t } = useTranslation();
  const Body = PREVIEW_BODY[type];

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-xl border border-hairline bg-surface shadow-[var(--shadow-level-2)] px-6 py-10 sm:px-10 sm:py-14 flex flex-col items-center gap-8">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
          {t('new_slide_dropdown.preview_label')}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-ink text-center flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-ink-muted shrink-0" />}
          {label}
        </h3>
        <div className="flex items-center justify-center w-full">
          {Body ? <Body /> : IMPORT_TYPES.has(type) ? <ImportPreview icon={Icon || ImageIcon} /> : <TextPreview />}
        </div>
      </div>
    </div>
  );
};

export default SlideTypePreview;
