import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2, User, Mail, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BootcampCarousel() {
  const scrollRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Student',
    city: ''
  });

  const bootcamps = [
    {
      id: 'chennai',
      city: 'Chennai',
      dotColor: '#ef4444', // Red
      date: '31 Jul - 1 Aug 2026',
      venue: "St. Joseph's Institute of Technology",
      registeredCount: 340,
      status: 'Open',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Temple Gopuram Landmark (Chennai) */}
          <path d="M100 15L125 50H75L100 15Z" fill="#52525b" opacity="0.4" />
          <path d="M70 50H130V75H70V50Z" fill="#3f3f46" opacity="0.5" />
          <path d="M65 75H135V105H65V75Z" fill="#27272a" opacity="0.6" />
          <path d="M60 105H140V140H60V105Z" fill="#18181b" opacity="0.7" />
          {/* Decorative Gopuram Pillars */}
          <rect x="75" y="80" width="8" height="20" rx="2" fill="#71717a" opacity="0.4" />
          <rect x="96" y="80" width="8" height="20" rx="2" fill="#71717a" opacity="0.4" />
          <rect x="117" y="80" width="8" height="20" rx="2" fill="#71717a" opacity="0.4" />
          <rect x="70" y="110" width="10" height="25" rx="2" fill="#a1a1aa" opacity="0.4" />
          <rect x="95" y="110" width="10" height="25" rx="2" fill="#a1a1aa" opacity="0.4" />
          <rect x="120" y="110" width="10" height="25" rx="2" fill="#a1a1aa" opacity="0.4" />
          <path d="M92 140V122C92 118.686 95.5817 116 100 116C104.418 116 108 118.686 108 122V140H92Z" fill="#71717a" />
          <path d="M10 140H190V145H10V140Z" fill="#27272a" />
        </svg>
      )
    },
    {
      id: 'mumbai',
      city: 'Mumbai',
      dotColor: '#f59e0b', // Yellow
      date: 'TBA',
      venue: 'IIT Bombay, Powai',
      registeredCount: 420,
      status: 'Coming Soon',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gateway of India Landmark (Mumbai) */}
          <path d="M50 140V60H150V140" stroke="#3f3f46" strokeWidth="8" />
          <path d="M40 55H160V65H40V55Z" fill="#52525b" />
          {/* Central Arch */}
          <path d="M80 140V95C80 84 89 75 100 75C111 75 120 84 120 95V140H80Z" fill="#18181b" />
          {/* Side Arches */}
          <path d="M55 140V110C55 105 59 100 64 100C69 100 73 105 73 110V140H55Z" fill="#27272a" />
          <path d="M127 140V110C127 105 131 100 136 100C141 100 145 105 145 110V140H127Z" fill="#27272a" />
          {/* Dome Top */}
          <path d="M85 55C85 40 100 35 100 35C100 35 115 40 115 55H85Z" fill="#71717a" opacity="0.6" />
          {/* Turrets */}
          <rect x="42" y="35" width="12" height="20" fill="#3f3f46" />
          <rect x="146" y="35" width="12" height="20" fill="#3f3f46" />
        </svg>
      )
    },
    {
      id: 'kolkata',
      city: 'Kolkata',
      dotColor: '#3b82f6', // Blue
      date: 'TBA',
      venue: 'Science City Auditorium',
      registeredCount: 290,
      status: 'Coming Soon',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Victoria Memorial (Kolkata) */}
          <path d="M80 70C80 50 100 40 100 40C100 40 120 50 120 70H80Z" fill="#52525b" />
          <rect x="96" y="25" width="8" height="15" fill="#a1a1aa" />
          <circle cx="100" cy="22" r="4" fill="#e4e4e7" />
          <rect x="60" y="70" width="80" height="15" fill="#3f3f46" />
          <rect x="40" y="85" width="120" height="55" fill="#27272a" />
          {/* Pillars */}
          <rect x="48" y="95" width="6" height="35" fill="#71717a" />
          <rect x="62" y="95" width="6" height="35" fill="#71717a" />
          <rect x="76" y="95" width="6" height="35" fill="#71717a" />
          <rect x="118" y="95" width="6" height="35" fill="#71717a" />
          <rect x="132" y="95" width="6" height="35" fill="#71717a" />
          <rect x="146" y="95" width="6" height="35" fill="#71717a" />
          {/* Central Gate */}
          <path d="M90 140V105C90 100 94 96 100 96C106 96 110 100 110 105V140H90Z" fill="#18181b" />
        </svg>
      )
    },
    {
      id: 'ahmedabad',
      city: 'Ahmedabad',
      dotColor: '#ef4444', // Red
      date: 'TBA',
      venue: 'Gujarat Technological University',
      registeredCount: 310,
      status: 'Coming Soon',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sun Temple / Heritage Stepwell Arch (Ahmedabad) */}
          <path d="M40 140V70L100 35L160 70V140H40Z" fill="#27272a" opacity="0.5" />
          <path d="M60 140V80L100 50L140 80V140H60Z" fill="#3f3f46" opacity="0.7" />
          <path d="M80 140V95C80 85 89 78 100 78C111 78 120 85 120 95V140H80Z" fill="#18181b" />
          <circle cx="100" cy="68" r="8" fill="#a1a1aa" opacity="0.6" />
          <line x1="100" y1="55" x2="100" y2="81" stroke="#e4e4e7" strokeWidth="2" opacity="0.4" />
          <line x1="87" y1="68" x2="113" y2="68" stroke="#e4e4e7" strokeWidth="2" opacity="0.4" />
        </svg>
      )
    },
    {
      id: 'bhopal',
      city: 'Bhopal',
      dotColor: '#f59e0b', // Yellow
      date: 'TBA',
      venue: 'MANIT Bhopal Campus',
      registeredCount: 210,
      status: 'Coming Soon',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Taj-ul-Masajid / Upper Lake Monument (Bhopal) */}
          <rect x="35" y="45" width="16" height="95" fill="#3f3f46" />
          <path d="M35 45L43 30L51 45H35Z" fill="#71717a" />
          <rect x="149" y="45" width="16" height="95" fill="#3f3f46" />
          <path d="M149 45L157 30L165 45H149Z" fill="#71717a" />
          {/* Main Central Dome */}
          <path d="M75 90C75 65 100 55 100 55C100 55 125 65 125 90H75Z" fill="#52525b" />
          <rect x="60" y="90" width="80" height="50" fill="#27272a" />
          <path d="M88 140V110C88 103 93 98 100 98C107 98 112 103 112 110V140H88Z" fill="#18181b" />
        </svg>
      )
    },
    {
      id: 'bengaluru',
      city: 'Bengaluru',
      dotColor: '#10b981', // Green
      date: '15 - 16 Aug 2026',
      venue: 'IISc Auditorium, Malleshwaram',
      registeredCount: 520,
      status: 'Open',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Vidhana Soudha Neo-Dravidian Structure (Bengaluru) */}
          <path d="M30 140H170V80H30V140Z" fill="#27272a" />
          <path d="M75 80C75 55 100 45 100 45C100 45 125 55 125 80H75Z" fill="#52525b" />
          <rect x="97" y="30" width="6" height="15" fill="#a1a1aa" />
          {/* Columns */}
          <rect x="42" y="90" width="8" height="40" fill="#71717a" />
          <rect x="58" y="90" width="8" height="40" fill="#71717a" />
          <rect x="74" y="90" width="8" height="40" fill="#71717a" />
          <rect x="118" y="90" width="8" height="40" fill="#71717a" />
          <rect x="134" y="90" width="8" height="40" fill="#71717a" />
          <rect x="150" y="90" width="8" height="40" fill="#71717a" />
          <path d="M90 140V102C90 96 94 92 100 92C106 92 110 96 110 102V140H90Z" fill="#18181b" />
        </svg>
      )
    },
    {
      id: 'hyderabad',
      city: 'Hyderabad',
      dotColor: '#8b5cf6', // Purple
      date: '22 - 23 Aug 2026',
      venue: 'T-Hub 2.0, HITEC City',
      registeredCount: 480,
      status: 'Open',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Charminar Four Minarets Arch (Hyderabad) */}
          <rect x="45" y="35" width="14" height="105" fill="#3f3f46" />
          <path d="M45 35L52 20L59 35H45Z" fill="#71717a" />
          <rect x="141" y="35" width="14" height="105" fill="#3f3f46" />
          <path d="M141 35L148 20L155 35H141Z" fill="#71717a" />
          <rect x="59" y="65" width="82" height="75" fill="#27272a" />
          <path d="M72 140V90C72 75 84 65 100 65C116 65 128 75 128 90V140H72Z" fill="#18181b" />
        </svg>
      )
    },
    {
      id: 'delhi',
      city: 'Delhi NCR',
      dotColor: '#ef4444', // Red
      date: '29 - 30 Aug 2026',
      venue: 'IIT Delhi, Hauz Khas',
      registeredCount: 610,
      status: 'Open',
      imageSvg: (
        <svg className="w-full h-full object-contain opacity-70 group-hover:opacity-90 transition-opacity duration-300" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* India Gate (Delhi) */}
          <path d="M45 140V45H155V140" stroke="#3f3f46" strokeWidth="12" />
          <path d="M35 40H165V52H35V40Z" fill="#52525b" />
          <path d="M70 140V80C70 63 83 50 100 50C117 50 130 63 130 80V140H70Z" fill="#18181b" />
        </svg>
      )
    }
  ];

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openRegisterModal = (bootcamp) => {
    setSelectedCity(bootcamp);
    setFormData(prev => ({ ...prev, city: bootcamp.city }));
    setIsSubmitted(false);
    setIsRegisterOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Please fill in your name and email');
      return;
    }
    setIsSubmitted(true);
    toast.success(`Successfully registered for Build with AI Bootcamp in ${selectedCity?.city}!`);
  };

  return (
    <section className="py-16 md:py-24 bg-canvas border-y border-hairline relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-accent-sky/5 via-accent-teal/10 to-accent-green/5 blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10b981] text-white font-bold text-sm sm:text-base shadow-sm mb-6 hover:bg-[#059669] transition-colors cursor-pointer"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            <span>Upcoming Bootcamps</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tight max-w-3xl leading-tight"
          >
            Register for Build with AI Bootcamp to the city near you
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-ink-muted max-w-2xl"
          >
            Join hands-on AI workshops, live coding sessions, and meet top educators & AI developers in your city.
          </motion.p>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel">
          <div
            ref={scrollRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scrollbar-hide py-4 px-2 scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {bootcamps.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="w-[300px] sm:w-[340px] md:w-[370px] shrink-0 bg-surface border border-hairline rounded-[22px] shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group snap-start"
              >
                {/* Top Notch Tab attached to card corner */}
                <div className="flex items-center gap-2.5 bg-[#18181b] text-white px-5 py-2.5 rounded-tl-[20px] rounded-br-[18px] w-fit font-bold text-sm sm:text-base z-10 shadow-sm">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: item.dotColor }}
                  />
                  <span>{item.city}</span>
                </div>

                {/* Card Main Body */}
                <div className="p-6 pt-4 flex-1 flex flex-col justify-between relative z-10">
                  <div className="space-y-4 pr-24">
                    {/* Date */}
                    <div className="flex items-start gap-2.5 text-ink-secondary text-sm font-medium">
                      <Calendar className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                      <span>{item.date}</span>
                    </div>

                    {/* Venue */}
                    <div className="flex items-start gap-2.5 text-ink-secondary text-sm">
                      <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.venue}</span>
                    </div>
                  </div>

                  {/* Right Side Landmark Image/SVG Graphic */}
                  <div className="absolute right-2 bottom-4 w-32 h-36 pointer-events-none z-0">
                    {item.imageSvg}
                  </div>

                  {/* Register Button */}
                  <div className="mt-8 pt-4 z-10">
                    <button
                      onClick={() => openRegisterModal(item)}
                      className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 cursor-pointer"
                    >
                      <span>Register now</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Centered Scroll Controls at Bottom */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => handleScroll('left')}
              className="w-11 h-11 rounded-full border border-hairline bg-surface hover:bg-canvas-soft text-ink flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-90 cursor-pointer"
              aria-label="Previous Bootcamp"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleScroll('right')}
              className="w-11 h-11 rounded-full border border-hairline bg-surface hover:bg-canvas-soft text-ink flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-90 cursor-pointer"
              aria-label="Next Bootcamp"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      <AnimatePresence>
        {isRegisterOpen && selectedCity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface border border-hairline rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[var(--shadow-level-2)] relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink hover:bg-canvas-soft rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!isSubmitted ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ink">Build with AI - {selectedCity.city}</h3>
                      <p className="text-xs text-ink-muted">{selectedCity.date} • {selectedCity.venue}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-hairline bg-canvas-soft focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:bg-surface text-ink transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-hairline bg-canvas-soft focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:bg-surface text-ink transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                        Role / Profile
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-hairline bg-canvas-soft focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:bg-surface text-ink transition-all appearance-none cursor-pointer"
                        >
                          <option value="Student">Student / Researcher</option>
                          <option value="Educator">Educator / Professor</option>
                          <option value="Developer">AI Developer / Engineer</option>
                          <option value="Founder">Startup Founder / Entrepreneur</option>
                          <option value="Corporate">Corporate / Industry Professional</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm shadow-md transition-all mt-4 cursor-pointer"
                    >
                      Confirm Registration
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-ink">You&apos;re Registered!</h3>
                  <p className="text-sm text-ink-muted max-w-xs mx-auto">
                    We have sent a confirmation email to <span className="font-semibold text-ink">{formData.email}</span> with your event pass for <span className="font-semibold text-ink">{selectedCity.city}</span>.
                  </p>
                  <button
                    onClick={() => setIsRegisterOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-active transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
