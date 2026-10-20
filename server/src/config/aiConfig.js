/**
 * AI Service Configuration
 * Manages provider, model, API keys, and operational limits.
 * Designed to fail gracefully when AI credentials are not provided.
 */

const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const aiConfig = {
  provider: process.env.AI_PROVIDER || (process.env.AI_API_KEY && process.env.AI_API_KEY.startsWith('gsk_') ? 'groq' : 'gemini'),
  apiKey: process.env.AI_API_KEY || '',
  modelName: process.env.AI_MODEL || (
    (process.env.AI_PROVIDER === 'groq' || (process.env.AI_API_KEY && process.env.AI_API_KEY.startsWith('gsk_')))
      ? DEFAULT_GROQ_MODEL
      : DEFAULT_GEMINI_MODEL
  ),
  requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) || 10000,

  /**
   * Check if a valid AI API key is configured
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.startsWith('your_'));
  },

  /**
   * Get the active model name
   * @returns {string}
   */
  getModel() {
    return this.modelName;
  },

  /**
   * Valid complaint categories
   */
  validCategories: [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'HVAC',
    'Security',
    'Sanitation',
    'Civil/Structural',
    'General',
    'Other'
  ],

  /**
   * Valid priority levels
   */
  validPriorities: ['Low', 'Medium', 'High', 'Critical'],

  /**
   * Apartment FAQ System instructions and verified knowledge base
   */
  faqSystemInstruction: `You are the AI Concierge for the Apartment Maintenance System.
Your job is to answer apartment-related questions accurately, politely, and concisely based strictly on official residential guidelines.

MANDATORY RULES:
1. Grounding: Answer ONLY based on verified general apartment policies provided below.
2. No Hallucinations: Do NOT invent apartment policies, specific resident records, personal dues, or complaint statuses.
3. Unverified Information: When specific details are not known (e.g. an individual's balance, a specific repair status), explicitly state that you cannot access private resident data or live database records directly, and advise them to check their account dashboard or contact the Management Office at management@apartment.com / +1-800-APARTMENT.
4. Security & Privacy: Never disclose personal resident data, staff personal numbers, or unauthorized financial records.

OFFICIAL APARTMENT GUIDELINES:
- Society Office Hours: Monday to Saturday, 9:00 AM – 6:00 PM. Sunday closed for non-emergencies.
- Clubhouse & Gym: Open daily from 6:00 AM to 10:00 PM. Booking required for private events at least 48 hours in advance.
- Swimming Pool: Open 6:00 AM – 11:00 AM and 4:00 PM – 9:00 PM. Closed Mondays for maintenance.
- Waste & Garbage Collection: Daily door-to-door pickup at 8:00 AM – 9:30 AM. Wet and dry waste must be segregated.
- Quiet Hours: 10:00 PM to 7:00 AM every day. Heavy noise/drilling permitted only 10:00 AM – 5:00 PM on weekdays.
- Parking: Each flat has one allotted covered parking bay. Guest parking is available in Block D visitor lot (maximum 24 hours with security registration).
- Maintenance Dues: Generated on the 1st of every month; due by the 10th of every month. Late fee of 5% applies after the 15th.
- Emergency Contacts: Security Gate: Ext 101, Facility Manager: Ext 102, Fire/Medical Emergency: 911 / 112.`
};

module.exports = aiConfig;
