import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageType, setLanguageType] = useState('regional'); // 'regional' or 'foreign'
  const dropdownRef = useRef(null);

  // Language options with their codes and names
  const languages = [
    { code: 'en', name: 'English', nativeName: 'EN', type: 'foreign' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', type: 'foreign' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', type: 'foreign' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', type: 'foreign' },
    { code: 'fr', name: 'French', nativeName: 'Français', type: 'foreign' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', type: 'foreign' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', type: 'foreign' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', type: 'foreign' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', type: 'foreign' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', type: 'foreign' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', type: 'foreign' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', type: 'foreign' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', type: 'foreign' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', type: 'foreign' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', type: 'foreign' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', type: 'regional' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', type: 'regional' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', type: 'regional' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', type: 'regional' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', type: 'regional' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', type: 'regional' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', type: 'regional' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', type: 'regional' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', type: 'regional' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', type: 'regional' }
  ];

  // Filter languages based on type and search term
  const filteredLanguages = languages.filter(lang => {
    const matchesType = languageType === 'regional' ? lang.type === 'regional' : lang.type === 'foreign';
    const matchesSearch = lang.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Get current language - handle both full locale codes (en-US) and language codes (en)
  const currentLanguage = languages.find(lang => lang.code === i18n.language || lang.code === i18n.language.split('-')[0]) || languages[0];

  // Handle language change
  const changeLanguage = (code) => {
    // Check if the language is one of the new coming soon languages
    const comingSoonLanguages = ['kn', 'gu', 'ml', 'pa', 'ur', 'id', 'ru', 'ja', 'de', 'ko', 'tr', 'it', 'vi', 'sw'];
    if (comingSoonLanguages.includes(code)) {
      const languageName = languages.find(lang => lang.code === code)?.name || 'This';
      toast(`${languageName} language coming soon`);
      return;
    }
    
    i18n.changeLanguage(code);
    setIsOpen(false);
    setSearchTerm(''); // Clear search when language is selected
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-blue-400/10 via-teal-400/10 to-orange-400/10 hover:from-blue-400/20 hover:via-teal-400/20 hover:to-orange-400/20 border border-blue-400/20 transition-all text-sm font-medium group min-w-fit"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400 bg-clip-text text-transparent font-bold">
            {currentLanguage.nativeName}
          </span>
          <svg 
            className={`w-4 h-4 shrink-0 transition-transform text-blue-400 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden backdrop-blur-xl">
          {/* Toggle Buttons */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setLanguageType('regional')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                languageType === 'regional'
                  ? 'bg-gradient-to-r from-blue-400/20 via-teal-400/20 to-orange-400/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Regional
            </button>
            <button
              onClick={() => setLanguageType('foreign')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                languageType === 'foreign'
                  ? 'bg-gradient-to-r from-blue-400/20 via-teal-400/20 to-orange-400/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Global
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                autoFocus
              />
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 ease-in-out ${
                    currentLanguage.code === lang.code
                      ? 'bg-gradient-to-r from-blue-400/20 via-teal-400/20 to-orange-400/20 border-l-4 border-blue-400'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center min-w-0 flex-1">
                      <span className={`font-medium truncate ${currentLanguage.code === lang.code ? 'text-white' : 'text-gray-300'}`}>
                        {lang.name}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                      currentLanguage.code === lang.code 
                        ? 'bg-gradient-to-r from-blue-400 to-teal-400 text-white' 
                        : 'bg-slate-700 text-gray-400'
                    }`}>
                      {lang.nativeName}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                No languages found
              </div>
            )}
          </div>
          
          {/* Decorative gradient bottom */}
          <div className="h-1 bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400"></div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;