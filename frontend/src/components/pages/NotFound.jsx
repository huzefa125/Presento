// eslint-disable-next-line
import { motion } from 'framer-motion';
import { ArrowLeft, Home, LayoutDashboard, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const hasInstitutionAdminToken = sessionStorage.getItem('institutionAdminToken');
  const dashboardPath = currentUser ? '/dashboard' : hasInstitutionAdminToken ? '/institution-admin' : null;

  return (
    <div className="min-h-screen bg-canvas-soft text-ink overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-12%] left-[-10%] w-[45%] h-[45%] rounded-full bg-accent-sky/10 blur-[120px]" />
        <div className="absolute bottom-[-12%] right-[-10%] w-[45%] h-[45%] rounded-full bg-accent-teal/10 blur-[120px]" />
        <div className="absolute top-[38%] right-[18%] w-[22%] h-[22%] rounded-full bg-accent-orange/10 blur-[90px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-canvas/80 border-b border-hairline">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            aria-label="Go to Presento home"
          >
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-on-primary">P</span>
            </div>
            <span className="text-xl font-bold text-ink">Presento</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center border border-hairline bg-surface px-3 py-1.5 rounded-full gap-2 text-sm font-medium text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </nav>

      <main className="relative z-10 min-h-screen container mx-auto px-6 pt-32 pb-16 grid lg:grid-cols-[1fr_0.9fr] gap-12 items-center">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-hairline mb-8 shadow-[var(--shadow-level-1)]">
            <span className="flex h-2 w-2 rounded-full bg-accent-orange" />
            <span className="text-sm font-semibold text-primary">404 page not found</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] mb-6">
            This slide wandered off.
          </h1>

          <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl mb-10">
            The page you are looking for does not exist, may have moved, or is waiting in another presentation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-on-primary font-bold hover:bg-primary-active active:scale-95 transition-all"
            >
              <Home className="w-5 h-5" />
              Go home
            </button>
            {dashboardPath && (
              <button
                onClick={() => navigate(dashboardPath)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-surface border border-hairline text-ink font-semibold hover:bg-canvas-soft active:scale-95 transition-all shadow-[var(--shadow-level-1)]"
              >
                <LayoutDashboard className="w-5 h-5" />
                Open dashboard
              </button>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="relative min-h-[360px] lg:min-h-[520px]"
          aria-hidden="true"
        >
          <div className="absolute inset-x-6 top-8 bottom-4 bg-surface border border-hairline rounded-xl shadow-[var(--shadow-level-2)] rotate-[-2deg]" />
          <div className="absolute inset-x-0 top-0 bottom-12 bg-surface border border-hairline rounded-xl shadow-[var(--shadow-level-1)] p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-hairline pb-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-sky" />
                <span className="w-3 h-3 rounded-full bg-accent-teal" />
                <span className="w-3 h-3 rounded-full bg-accent-orange" />
              </div>
              <span className="text-sm font-semibold text-ink-faint">Slide 404</span>
            </div>

            <div className="grid grid-cols-[88px_1fr] gap-5 items-start">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`h-14 rounded-md border border-hairline ${item === 2 ? 'bg-primary/10' : 'bg-canvas-soft'}`}
                  />
                ))}
              </div>
              <div className="rounded-lg border border-dashed border-ink-faint/60 bg-canvas-soft p-6 md:p-10 min-h-[260px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-surface border border-hairline shadow-[var(--shadow-level-1)] flex items-center justify-center mb-5">
                  <Search className="w-9 h-9 text-primary" />
                </div>
                <div className="text-8xl md:text-9xl font-black text-ink/10 leading-none mb-3">404</div>
                <div className="h-3 w-48 max-w-full rounded-full bg-ink/10 mb-3" />
                <div className="h-3 w-32 rounded-full bg-ink/10" />
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default NotFound;
