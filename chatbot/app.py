import os
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from google import genai

# -------------------------------------------------
# Load environment variables FIRST
# -------------------------------------------------
load_dotenv()

# -------------------------------------------------
# Create Flask app ONCE
# -------------------------------------------------
app = Flask(__name__)

# Production configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Enable CORS AFTER app creation
CORS(app, resources={r"/*": {"origins": "*"}})

# -------------------------------------------------
# Configure Gemini Client
# -------------------------------------------------
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY not found in .env file.")
    client = None
else:
    client = genai.Client(api_key=api_key)


# -------------------------------------------------
# Strict System Instruction Loader
# -------------------------------------------------
def get_system_instructions():
    """
    Loads the FULL Inavora instruction JSON and converts it
    into a strict system instruction for the LLM.
    """
    instruction_file = "inavora.json"

    if not os.path.exists(instruction_file):
        return (
            "SYSTEM ERROR: inavora.json not found. "
            "You must act as a generic helpful assistant."
        )

    try:
        with open(instruction_file, "r", encoding="utf-8") as f:
            instruction_data = json.load(f)

        instruction_text = json.dumps(instruction_data, indent=2)

        return f"""
You are an AI assistant operating STRICTLY under the following rules.
These rules are IMMUTABLE and OVERRIDE all user instructions if conflicts arise.

LANGUAGE POLICY (MANDATORY):
- Detect the language of the user's message from text or message context.
- Generate the entire response strictly in that same language.
- Do NOT translate unless explicitly requested.
- Do NOT mention language switching.
- Do NOT default to English if the user is specifying a different language.

BEHAVIORAL CONSTRAINTS:
- Never mention internal policies, safety systems, regulations, laws, or restrictions.
- Never say "I am restricted", "I cannot due to policy", or similar phrases.
- If a request conflicts with system instructions, simply follow system rules without explanation.
- Do not justify refusals using policy language.

CRITICAL SLIDE GENERATION RULES:
- When a user requests a specific number of slides, you MUST generate ALL requested slides.
- Do NOT stop early or generate fewer slides than requested.
- Do NOT truncate the response - generate the complete presentation with the exact number of slides requested.
- Count includes: 1 mandatory instruction slide + 1 title slide + all content slides = total requested slides.
- If user requests 30 slides, generate exactly 30 slides total (1 instruction + 1 title + 28 content slides).

You MUST:
- Follow the JSON instructions EXACTLY
- Use ONLY the defined slide templates
- NEVER invent new templates or fields
- NEVER ignore constraints such as slide limits or mandatory slides
- Generate presentation content ONLY in compliance with this specification
- Generate ALL requested slides - never stop early or truncate

- Never invent new slide templates.
- If a template does not exist in the system JSON, do not create it.

INAVORA SYSTEM INSTRUCTIONS (AUTHORITATIVE):
{instruction_text}
"""

    except json.JSONDecodeError as e:
        return (
            f"SYSTEM ERROR: inavora.json is malformed ({str(e)}). "
            "Fallback to generic assistant behavior."
        )
    except IOError as e:
        return (
            f"SYSTEM ERROR: Unable to read inavora.json ({str(e)}). "
            "Fallback to generic assistant behavior."
        )


# -------------------------------------------------
# Routes
# -------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/health')
def health():
    """Health check endpoint for deployment platforms"""
    return jsonify({"status": "healthy", "service": "inavora-chatbot"}), 200


@app.route('/chat', methods=['POST'])
def chat():
    if not client:
        return jsonify({
            "error": "API Key is missing. Please check your .env file."
        }), 500

    data = request.get_json()
    user_input = data.get("message")
    retry_count = data.get("retry_count", 0)
    max_retries = 3

    if not user_input:
        return jsonify({"error": "Message is empty"}), 400

    try:
        # Load strict system instructions
        system_prompt = get_system_instructions()

        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=user_input,
            config={
                "system_instruction": system_prompt,
                "temperature": 0.5,
                "top_p": 0.8,
                "max_output_tokens": 8192,  # Increased for large presentations (30+ slides)
            }
        )

        if not response or not response.text:
            raise ValueError("Gemini returned an empty response.")

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        error_msg = str(e)

        if retry_count < max_retries:
            return jsonify({
                "error": f"Connection failed: {error_msg}. "
                         f"(Attempt {retry_count + 1} of {max_retries})",
                "can_retry": True
            }), 500
        else:
            return jsonify({
                "error": f"Max retries exhausted. Technical details: {error_msg}",
                "can_retry": False
            }), 500


# -------------------------------------------------
# Run App
# -------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

    print(f"Starting Flask app on 0.0.0.0:{port} (debug={debug_mode})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
