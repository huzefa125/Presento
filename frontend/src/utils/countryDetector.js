/**
 * Detect country from browser locale/timezone
 * @returns {string|null} Country name or null if detection fails
 */
export const detectCountryFromBrowser = () => {
  try {
    // Method 1: Try to get country from timezone (MOST RELIABLE - prioritize this)
    // Timezone is more accurate than locale for country detection
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Comprehensive timezone to country mapping
      const timezoneCountryMap = {
        // India timezones
        'Asia/Kolkata': 'India',
        'Asia/Calcutta': 'India', // Alternative name
        
        // United States timezones
        'America/New_York': 'United States',
        'America/Detroit': 'United States',
        'America/Kentucky/Louisville': 'United States',
        'America/Kentucky/Monticello': 'United States',
        'America/Indiana/Indianapolis': 'United States',
        'America/Indiana/Vincennes': 'United States',
        'America/Indiana/Winamac': 'United States',
        'America/Indiana/Marengo': 'United States',
        'America/Indiana/Petersburg': 'United States',
        'America/Indiana/Vevay': 'United States',
        'America/Chicago': 'United States',
        'America/Indiana/Tell_City': 'United States',
        'America/Indiana/Knox': 'United States',
        'America/Menominee': 'United States',
        'America/North_Dakota/Center': 'United States',
        'America/North_Dakota/New_Salem': 'United States',
        'America/North_Dakota/Beulah': 'United States',
        'America/Denver': 'United States',
        'America/Boise': 'United States',
        'America/Phoenix': 'United States',
        'America/Los_Angeles': 'United States',
        'America/Anchorage': 'United States',
        'America/Juneau': 'United States',
        'America/Sitka': 'United States',
        'America/Metlakatla': 'United States',
        'America/Yakutat': 'United States',
        'America/Nome': 'United States',
        'America/Adak': 'United States',
        'Pacific/Honolulu': 'United States',
        
        // Other countries
        'Europe/London': 'United Kingdom',
        'Europe/Paris': 'France',
        'Europe/Berlin': 'Germany',
        'Asia/Tokyo': 'Japan',
        'Asia/Shanghai': 'China',
        'Asia/Dubai': 'United Arab Emirates',
        'Australia/Sydney': 'Australia',
        'America/Toronto': 'Canada',
        'America/Vancouver': 'Canada',
        'America/Sao_Paulo': 'Brazil',
        'Europe/Madrid': 'Spain',
        'Europe/Rome': 'Italy',
        'Asia/Singapore': 'Singapore',
        'Asia/Hong_Kong': 'Hong Kong',
        'Asia/Bangkok': 'Thailand',
        'Asia/Jakarta': 'Indonesia',
        'Asia/Manila': 'Philippines',
        'Asia/Seoul': 'South Korea',
        'Asia/Kuala_Lumpur': 'Malaysia',
        'Asia/Dhaka': 'Bangladesh',
        'Asia/Karachi': 'Pakistan',
        'Asia/Colombo': 'Sri Lanka',
        'Asia/Kathmandu': 'Nepal',
        'Asia/Kabul': 'Afghanistan',
        'Asia/Tehran': 'Iran',
        'Asia/Riyadh': 'Saudi Arabia',
        'Africa/Cairo': 'Egypt',
        'Africa/Johannesburg': 'South Africa',
        'America/Mexico_City': 'Mexico',
        'America/Argentina/Buenos_Aires': 'Argentina',
        'America/Chile/Santiago': 'Chile',
        'Europe/Moscow': 'Russia',
        'Europe/Amsterdam': 'Netherlands',
        'Europe/Brussels': 'Belgium',
        'Europe/Stockholm': 'Sweden',
        'Europe/Zurich': 'Switzerland',
        'Europe/Vienna': 'Austria',
        'Europe/Athens': 'Greece',
        'Europe/Lisbon': 'Portugal',
        'Europe/Dublin': 'Ireland',
        'Europe/Warsaw': 'Poland',
        'Europe/Prague': 'Czech Republic',
        'Europe/Budapest': 'Hungary',
        'Europe/Bucharest': 'Romania',
        'Europe/Helsinki': 'Finland',
        'Europe/Oslo': 'Norway',
        'Europe/Copenhagen': 'Denmark',
        'Pacific/Auckland': 'New Zealand'
      };

      if (timezoneCountryMap[timezone]) {
        return timezoneCountryMap[timezone];
      }
      
      // Fallback: Check timezone prefix for region-based detection
      if (timezone.startsWith('Asia/')) {
        // For Asian timezones not in our map, try to infer from common patterns
        if (timezone.includes('Kolkata') || timezone.includes('Calcutta') || timezone.includes('Delhi') || timezone.includes('Mumbai') || timezone.includes('Chennai') || timezone.includes('Bangalore') || timezone.includes('Hyderabad')) {
          return 'India';
        }
      }
    } catch (error) {
      console.warn('Failed to detect country from timezone:', error);
    }

    // Method 2: Try to get country from locale (only if timezone didn't work)
    // Check if locale has country code (e.g., "hi-IN", "en-IN" -> India)
    const locale = navigator.language || navigator.userLanguage;
    if (locale) {
      const parts = locale.split('-');
      if (parts.length > 1) {
        const countryCode = parts[1].toUpperCase();
        // Convert country code to country name
        const countryName = getCountryNameFromCode(countryCode);
        if (countryName) {
          return countryName;
        }
      }
    }

    // Method 3: Try using Intl.DisplayNames to get country name from locale
    try {
      if (locale) {
        const parts = locale.split('-');
        if (parts.length > 1) {
          const countryCode = parts[1].toUpperCase();
          const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
          const countryName = displayNames.of(countryCode);
          if (countryName) {
            return countryName;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to detect country using Intl.DisplayNames:', error);
    }

    return null;
  } catch (error) {
    console.warn('Failed to detect country:', error);
    return null;
  }
};

/**
 * Convert country code to country name
 * @param {string} countryCode - Two-letter country code (e.g., "US", "IN")
 * @returns {string|null} Country name or null
 */
const getCountryNameFromCode = (countryCode) => {
  const countryMap = {
    'US': 'United States',
    'IN': 'India',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'JP': 'Japan',
    'CN': 'China',
    'KR': 'South Korea',
    'RU': 'Russia',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'ID': 'Indonesia',
    'PH': 'Philippines',
    'VN': 'Vietnam',
    'BD': 'Bangladesh',
    'PK': 'Pakistan',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'AF': 'Afghanistan',
    'IR': 'Iran',
    'EG': 'Egypt',
    'ZA': 'South Africa',
    'AR': 'Argentina',
    'CL': 'Chile',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'GR': 'Greece',
    'PT': 'Portugal',
    'IE': 'Ireland',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'FI': 'Finland',
    'NO': 'Norway',
    'DK': 'Denmark',
    'NZ': 'New Zealand',
    'HK': 'Hong Kong',
    'TW': 'Taiwan',
    'TR': 'Turkey',
    'IL': 'Israel',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'ET': 'Ethiopia',
    'TZ': 'Tanzania',
    'UG': 'Uganda',
    'ZW': 'Zimbabwe',
    'MA': 'Morocco',
    'DZ': 'Algeria',
    'TN': 'Tunisia',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'PY': 'Paraguay',
    'UY': 'Uruguay',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'NI': 'Nicaragua',
    'SV': 'El Salvador',
    'DO': 'Dominican Republic',
    'CU': 'Cuba',
    'JM': 'Jamaica',
    'TT': 'Trinidad and Tobago',
    'BB': 'Barbados',
    'BS': 'Bahamas',
    'BZ': 'Belize',
    'GY': 'Guyana',
    'SR': 'Suriname',
    'GF': 'French Guiana',
    'FK': 'Falkland Islands',
    'GS': 'South Georgia and the South Sandwich Islands'
  };

  return countryMap[countryCode] || null;
};

