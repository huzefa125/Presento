import { useState } from 'react';
import { X, ArrowLeft, Layers, Check, LayoutGrid, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Check-ins & Icebreakers',
  'Training & Evaluation',
  'Workshop & Brainstorming',
  'Feedback & Reflection',
  'Plan & Prioritize',
  'Events & Town Halls',
];

const TEMPLATES = [
  {
    id: 'team-building-quiz',
    category: 'Check-ins & Icebreakers',
    title: 'Team building quiz',
    slideCount: 11,
    bgAccent: 'bg-[#EEF2FF]',
    description: 'A ready-made quiz that adds energy and friendly competition to your team sessions. No prep needed.',
    bullets: [
      'Use during a longer workshop or offsite to add variety',
      'Best for groups of 5–25, in-person or remote',
      'Encourages participation, laughter, and maybe a bit of bragging rights',
    ],
    previewHeadline: 'Who made the most sales last month?',
    previewType: 'quiz',
    slides: [
      { type: 'instruction', title: 'Team building quiz', question: 'Please join the Menti by scanning the QR code' },
      { type: 'quiz', title: 'Who made the most sales last month?', question: 'Who made the most sales last month?', options: ['Mira', 'Johnny', 'Martin'] },
      { type: 'instruction', title: 'Quiz leaderboard', question: 'Top Quiz participants will be displayed here' },
      { type: 'quiz', title: 'Which employee has broken the copy machine — four times?', question: 'Which employee has broken the copy machine — four times?', options: ['Alex', 'Sarah', 'David'] },
      { type: 'instruction', title: 'Quiz leaderboard', question: 'Top Quiz participants will be displayed here' },
      { type: 'wordcloud', title: 'Describe our team culture in 1 word', question: 'Describe our team culture in 1 word' },
      { type: 'quiz', title: 'Who is most likely to bring donuts to the office?', question: 'Who is most likely to bring donuts to the office?', options: ['Lisa', 'Tom', 'Sam'] },
      { type: 'scales', title: 'How energized do you feel today?', question: 'How energized do you feel today?' },
      { type: 'instruction', title: 'Final Quiz Leaderboard', question: 'Congratulations to the winners!' },
    ],
  },
  {
    id: 'fun-meeting-icebreakers',
    category: 'Check-ins & Icebreakers',
    title: 'Fun meeting icebreakers',
    slideCount: 5,
    bgAccent: 'bg-[#FAF5FF]',
    description: 'Warm up your audience with quick, fun icebreaker questions before your meeting starts.',
    bullets: [
      'Great for starting all-hands, standups, or workshops',
      'Takes less than 5 minutes to complete',
      'Gets everyone involved immediately',
    ],
    previewHeadline: 'If last month was a theme park ride, which one would it be?',
    previewType: 'wordcloud',
    slides: [
      { type: 'instruction', title: 'Fun meeting icebreakers', question: 'Welcome! Grab your phone and join in' },
      { type: 'wordcloud', title: 'If last month was a theme park ride, which one would it be?', question: 'If last month was a theme park ride, which one would it be?' },
      { type: 'open_ended', title: 'What is your go-to morning beverage?', question: 'What is your go-to morning beverage?' },
      { type: 'scales', title: 'How is your energy level right now?', question: 'How is your energy level right now?' },
      { type: 'mcq', title: 'Where would you rather be right now?', question: 'Where would you rather be right now?', options: ['Sunny Beach', 'Mountain Cabin', 'Cozy Home', 'Office Coffee Shop'] },
    ],
  },
  {
    id: 'meeting-pulse-check',
    category: 'Feedback & Reflection',
    title: 'Meeting pulse-check',
    slideCount: 6,
    bgAccent: 'bg-[#F0FDF4]',
    description: 'Quickly gather real-time feedback on team morale, workload, and meeting effectiveness.',
    bullets: [
      'Ideal for weekly 1:1s or retrospective meetings',
      'Anonymous and honest sentiment tracking',
      'Helps leaders adjust meeting frequency and structure',
    ],
    previewHeadline: 'How do you feel about work this week?',
    previewType: 'scales',
    slides: [
      { type: 'instruction', title: 'Meeting pulse-check', question: 'Weekly team pulse check' },
      { type: 'scales', title: 'How do you feel about work this week?', question: 'Rate your feeling from 1 to 5' },
      { type: 'wordcloud', title: 'What is top of mind for you today?', question: 'What is top of mind for you today?' },
      { type: 'open_ended', title: 'What blockages or challenges are you facing?', question: 'What blockages or challenges are you facing?' },
      { type: 'scales', title: 'Was this meeting a good use of your time?', question: 'Rate meeting effectiveness' },
    ],
  },
  {
    id: 'workshop-brainstorming',
    category: 'Workshop & Brainstorming',
    title: 'Workshop & Brainstorming',
    slideCount: 7,
    bgAccent: 'bg-[#FFF7ED]',
    description: 'A structured collaborative framework for collecting ideas, grouping topics, and voting.',
    bullets: [
      'Designed for design sprints and strategy sessions',
      'Includes 2x2 matrix for prioritization',
      'Allows 100-point budget allocation voting',
    ],
    previewHeadline: 'What is the most important trait of a leader?',
    previewType: '2x2_grid',
    slides: [
      { type: 'instruction', title: 'Brainstorming Session', question: 'Join to submit and vote on ideas' },
      { type: 'wordcloud', title: 'What is the most important trait of a leader?', question: 'What is the most important trait of a leader?' },
      { type: 'open_ended', title: 'Share your top 3 feature ideas for Q3', question: 'Share your top 3 feature ideas for Q3' },
      { type: '2x2_grid', title: 'Feasibility vs Impact Matrix', question: 'Plot ideas on Feasibility vs Impact' },
      { type: 'hundred_points', title: 'Allocate 100 points to your top priorities', question: 'Allocate 100 points to your top priorities' },
    ],
  },
  {
    id: 'training-evaluation',
    category: 'Training & Evaluation',
    title: 'Training & Course Evaluation',
    slideCount: 8,
    bgAccent: 'bg-[#FDF2F8]',
    description: 'Evaluate course engagement, measure learning outcomes, and gather participant reviews.',
    bullets: [
      'Perfect for post-training assessments',
      'Combines quiz validation with participant rating',
    ],
    previewHeadline: 'What is your preferred method of learning?',
    previewType: 'mcq',
    slides: [
      { type: 'instruction', title: 'Training Evaluation', question: 'Thank you for attending!' },
      { type: 'mcq', title: 'What is your preferred method of learning?', question: 'What is your preferred method of learning?', options: ['Hands-on Practice', 'Video Tutorials', 'Group Discussion', 'Reading Docs'] },
      { type: 'quiz', title: 'Knowledge Check Question 1', question: 'Knowledge Check Question 1', options: ['Option A', 'Option B', 'Option C'] },
      { type: 'scales', title: 'Rate the clarity of course material', question: 'Rate clarity from 1 to 5' },
      { type: 'open_ended', title: 'What topic would you like to learn next?', question: 'What topic would you like to learn next?' },
    ],
  },
];

const TemplatesModal = ({ isOpen, onClose, onApplyTemplate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('mentimeter');
  const [activeCategory, setActiveCategory] = useState('Check-ins & Icebreakers');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  if (!isOpen) return null;

  const filteredTemplates = TEMPLATES.filter((tpl) => tpl.category === activeCategory || activeCategory === 'All');

  const handleApply = (template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
      toast.success(`Template "${template.title}" applied with ${template.slideCount} slides!`);
    }
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      {/* Modal Container matching Mentimeter Screenshots 1-5 */}
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[720px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Detail & Preview View (Screenshots 3, 4 & 5) */}
        {selectedTemplate ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Panel: Info & Use Template button */}
            <div className="w-full md:w-[340px] bg-white p-6 sm:p-7 flex flex-col justify-between border-r border-gray-200 overflow-y-auto">
              <div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black mb-6 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                <span className="text-xs font-semibold text-gray-400 block mb-2">{selectedTemplate.slideCount} slides</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedTemplate.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{selectedTemplate.description}</p>

                <ul className="space-y-2 mb-8">
                  {selectedTemplate.bullets?.map((bullet, idx) => (
                    <li key={idx} className="text-xs text-gray-600 leading-relaxed flex items-start gap-1.5">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => handleApply(selectedTemplate)}
                  className="w-full py-3 px-6 bg-[#1E293B] hover:bg-black text-white text-sm font-bold rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Use template
                </button>
              </div>
            </div>

            {/* Right Panel: Scrollable Slide Previews List */}
            <div className="flex-1 bg-[#F8FAFC] p-6 overflow-y-auto space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedTemplate.slides?.map((slide, idx) => (
                <div key={idx} className={`${selectedTemplate.bgAccent} rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs min-h-[220px] flex flex-col justify-between relative`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                    <span>Mentimeter</span>
                    <span className="uppercase tracking-wider text-indigo-600">{slide.type}</span>
                  </div>

                  <div className="my-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{slide.title}</h3>
                    {slide.question && <p className="text-xs text-gray-500">{slide.question}</p>}

                    {/* Preview Visualization */}
                    {slide.options && (
                      <div className="mt-4 max-w-sm mx-auto space-y-1.5">
                        {slide.options.map((opt, oIdx) => (
                          <div key={oIdx} className="bg-white/80 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 flex justify-between items-center">
                            <span>{opt}</span>
                            <span className="text-[10px] text-gray-400">0</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 text-right">
                    Slide {idx + 1} of {selectedTemplate.slides.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Main Templates Grid View (Screenshots 1 & 2) */
          <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-hidden">
            {/* Top Header & Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('mentimeter')}
                  className={`text-base font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'mentimeter' ? 'text-gray-900 border-indigo-600' : 'text-gray-400 border-transparent'
                  }`}
                >
                  Presento templates
                </button>
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`text-base font-medium pb-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'workspace' ? 'text-gray-900 border-indigo-600 font-bold' : 'text-gray-400 border-transparent'
                  }`}
                >
                  <span>Workspace templates</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Pro</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Pills Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-white border-2 border-indigo-600 text-indigo-700 shadow-xs'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid (3 Columns) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 pr-1 custom-scrollbar">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                >
                  {/* Top Preview Banner */}
                  <div className={`${template.bgAccent} p-6 h-40 flex flex-col justify-between items-center text-center relative`}>
                    <p className="text-xs font-bold text-gray-800 line-clamp-2 mt-2">{template.previewHeadline}</p>
                    <div className="w-16 h-2 bg-indigo-500/20 rounded-full"></div>
                  </div>

                  {/* Bottom Info */}
                  <div className="p-5 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {template.title}
                    </h3>
                    <span className="text-xs text-gray-500 font-medium">{template.slideCount} slides</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TemplatesModal;
