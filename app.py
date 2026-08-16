"""
Flask app — ശ്രീ പൂകുന്നത്ത് കാട്ടുമാടം മുത്തശ്ശ്യമ്മ ക്ഷേത്രം

Run: python app.py   (reads config from .env — copy .env.example first)
"""
import os
import logging
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, render_template
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# never hardcode — required for session/csrf use later, must come from env in prod
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-only-change-me")
# DEBUG must be False in production — stack traces leak source paths & config
app.config["DEBUG"] = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

# ---------------------------------------------------------------------
# Rate limiting — protects against scraping / form-spam / brute force.
# Storage defaults to in-memory (fine for single-process dev). For prod
# with multiple workers, set RATELIMIT_STORAGE_URI to redis://... in .env.
# ---------------------------------------------------------------------
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["60 per minute", "1000 per day"],
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
)

# ---------------------------------------------------------------------
# Security headers — every response, no data leak via caching/framing/mime-sniff
# ---------------------------------------------------------------------
@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    # Server header leaks Werkzeug version by default — strip it
    response.headers.pop("Server", None)
    return response


# ---------------------------------------------------------------------
# Optional MongoDB — app still runs without it (site is read-only content
# for now). Connect only when MONGO_URI is set, so local dev without a
# DB doesn't crash on startup.
# ---------------------------------------------------------------------
db = None
if os.environ.get("MONGO_URI"):
    try:
        from database import Database
        db = Database().db
    except Exception as exc:  # noqa: BLE001 — log and degrade, don't crash the site
        logger.error("MongoDB unavailable, continuing without it: %s", exc)

# ---------------------------------------------------------------------
# Site content — edit here, not in the template.
# Bank details intentionally removed: donations will move to Razorpay.
# Address intentionally left as a placeholder until confirmed.
# ---------------------------------------------------------------------

PHONE_1 = os.environ.get("TEMPLE_PHONE_1", "9847501188")
PHONE_2 = os.environ.get("TEMPLE_PHONE_2", "9895124698")
LOCATION_TEXT = os.environ.get("TEMPLE_LOCATION_TEXT", "വിലാസം ഉടൻ ചേർക്കും")

TEMPLE_ITEMS = [
    {"name": "ക്ഷേത്ര തറ", "amount": "1,00,000"},
    {"name": "ക്ഷേത്ര ചുമര്", "amount": "1,50,000"},
    {"name": "സോപാനം — വലുത്", "amount": "36,000"},
    {"name": "സോപാനം — ചെറുത്", "amount": "22,000"},
    {"name": "പാട്ടുപുരയുടെ കരികൽ തൂൺ (4 എണ്ണം)", "amount": "1,00,000"},
    {"name": "പാട്ടുപുരയുടെ കരികൽ ഭിത്തി", "amount": "1,80,000"},
    {"name": "ഓവ് കരികൽ", "amount": "10,000"},
    {"name": "അഴിക്കൂടിന്റെ വലിയ തൂൺ (8 എണ്ണം)", "amount": "1,60,000"},
    {"name": "ശ്രീകോവിൽ വലിയ ഉത്തരം", "amount": "1,00,000"},
    {"name": "അഴിക്കൂടിന്റെ ചെറിയ ഉത്തരം", "amount": "60,000"},
    {"name": "അഴിക്കൂടിന്റെ ചെറിയ തൂണുകൾ (36 എണ്ണം)", "amount": "3,60,000"},
    {"name": "ശ്രീകോവിൽ മേൽക്കൂരയുടെ കഴുക്കോൽ (36 എണ്ണം)", "amount": "3,60,000"},
    {"name": "ശ്രീകോവിൽ മച്ച്", "amount": "20,000"},
    {"name": "പാട്ടുപുരയുടെ മച്ച്", "amount": "30,000"},
    {"name": "ശ്രീകോവിൽ വലിയ വാതിൽ", "amount": "80,000"},
    {"name": "പാട്ടുപുരയുടെ ചെറിയ വാതിൽ", "amount": "20,000"},
    {"name": "താഴികക്കുടം (3 എണ്ണം)", "amount": "60,000"},
    {"name": "ഗണപതി ശ്രീകോവിൽ നിർമ്മാണത്തിന്", "amount": "1,00,000"},
    {"name": "ശ്രീകോവിലിന്റെ ചുറ്റുമതിൽ നിർമ്മാണം", "amount": "3,00,000"},
    {"name": "ശ്രീകോവിലിന് മുന്നിൽ നടപ്പന്തൽ നിർമ്മിക്കാൻ", "amount": "10,00,000"},
    {"name": "ശ്രീകോവിലിനും തേവാര മഠത്തിനും ചുറ്റും കരികൽ പതിക്കാൻ", "amount": "3,00,000"},
]
TEMPLE_TOTAL = "35,48,000"

THEVARAMADAM_ITEMS = [
    {"name": "തേവാര മഠം തറ", "amount": "2,50,000"},
    {"name": "ചുമര്", "amount": "3,00,000"},
    {"name": "പൂമുഖം", "amount": "2,00,000"},
    {"name": "തേവാര മഠം കട്ടില (5 എണ്ണം)", "amount": "1,50,000"},
    {"name": "സോപാനം (3 എണ്ണം)", "amount": "90,000"},
    {"name": "കരികൽ തൂണുകൾ വരാന്തയ്ക്ക് (18 എണ്ണം)", "amount": "4,50,000"},
    {"name": "കരികൽ തൂണുകളുടെ പീഠം (18 എണ്ണം)", "amount": "90,000"},
    {"name": "തൂണുകൾക്കിടയിലെ കരികല്ലിന്റെ അരഭിത്തി (8 എണ്ണം)", "amount": "4,00,000"},
    {"name": "ജനലുകൾ (6 എണ്ണം)", "amount": "1,50,000"},
    {"name": "കഴുക്കോൽ (150 എണ്ണം)", "amount": "9,00,000"},
    {"name": "തേവാര മഠം മച്ച് പാവൽ", "amount": "3,00,000"},
    {"name": "തേവാര മഠം ഓട് (3000 എണ്ണം)", "amount": "1,20,000"},
]
THEVARAMADAM_TOTAL = "34,00,000"

SREEMOOLAM_ITEMS = [
    {"name": "ശ്രീ മൂലസ്ഥാനം തറ", "amount": "1,00,000"},
    {"name": "കല്ല് (500×120)", "amount": "60,000"},
    {"name": "കരികൽ കട്ടില", "amount": "25,000"},
    {"name": "തൂൺ (4 എണ്ണം)", "amount": "1,00,000"},
    {"name": "മുന്നിലെ മണ്ഡപം", "amount": "2,00,000"},
    {"name": "പ്രദിക്ഷിണ വഴി", "amount": "2,00,000"},
]
SREEMOOLAM_TOTAL = "6,85,000"

KALARI_ITEMS = [
    {"name": "കളരിസ്ഥാനത്തിന്റെ നിർമ്മാണം (അടിത്തറ അടക്കം)", "amount": "3,00,000"},
    {"name": "പൂത്തറ", "amount": "1,00,000"},
    {"name": "നിലം തറയോട് പാകൽ", "amount": "3,00,000"},
    {"name": "മതിലിന് ചുറ്റും കരികൽ പതിക്കൽ", "amount": "2,00,000"},
    {"name": "കളരിയുടെ പുറംചുമര്", "amount": "4,00,000"},
    {"name": "മുന്നിലെ വരാന്ത (തറയടക്കം)", "amount": "2,00,000"},
    {"name": "കരികൽ തൂണുകൾ (10 എണ്ണം)", "amount": "2,50,000"},
    {"name": "2 ഭാഗം അഴിക്കൂടിന്", "amount": "4,00,000"},
    {"name": "മേൽക്കൂര ഉത്തരം", "amount": "4,00,000"},
    {"name": "കഴുക്കോൽ (100 എണ്ണം)", "amount": "5,00,000"},
    {"name": "ഓട് (3000 എണ്ണം)", "amount": "1,20,000"},
]
KALARI_TOTAL = "31,70,000"

NAKSHATRA_TREES = [
    {"star": "അശ്വതി", "tree": "കാഞ്ഞിരം"}, {"star": "ഭരണി", "tree": "നെല്ലി"},
    {"star": "കാർത്തിക", "tree": "അത്തി"}, {"star": "രോഹിണി", "tree": "ഞാവൽ"},
    {"star": "മകീര്യം", "tree": "കരിങ്ങാലി"}, {"star": "തിരുവാതിര", "tree": "കരിമരം"},
    {"star": "പുണർതം", "tree": "മുള"}, {"star": "പൂയ്യം", "tree": "അരയാൽ"},
    {"star": "ആയില്യം", "tree": "നാഗചെമ്പ"}, {"star": "മകം", "tree": "പേരാൽ"},
    {"star": "പൂരം", "tree": "ചമത-പ്ലാശ്"}, {"star": "ഉത്രം", "tree": "ഇത്തി"},
    {"star": "അത്തം", "tree": "അമ്പഴം"}, {"star": "ചിത്തിര", "tree": "കൂവളം"},
    {"star": "ചോതി", "tree": "നീർമരുത്"}, {"star": "വിശാഖം", "tree": "വയ്യങ്കത"},
    {"star": "അനിഴം", "tree": "ഇലഞ്ഞി"}, {"star": "തൃക്കേട്ട", "tree": "വെട്ടി"},
    {"star": "മൂലം", "tree": "വെള്ളപൈൻ"}, {"star": "പൂരാടം", "tree": "വഞ്ചിമരം"},
    {"star": "ഉത്രാടം", "tree": "പ്ലാവ്"}, {"star": "തിരുവോണം", "tree": "എരുക്ക്"},
    {"star": "അവിട്ടം", "tree": "വഹ്നി"}, {"star": "ചതയം", "tree": "കടമ്പ്"},
    {"star": "പൂരുരുട്ടാതി", "tree": "തേന്മാവ്"}, {"star": "ഉത്രട്ടാതി", "tree": "കരിമ്പന"},
    {"star": "രേവതി", "tree": "ഇലിപ്പ"},
]


@app.route("/")
@limiter.limit("30 per minute")  # tighter than default — page has SVG-heavy render
def index():
    return render_template(
        "index.html",
        phone1=PHONE_1,
        phone2=PHONE_2,
        location_text=LOCATION_TEXT,
        temple_items=TEMPLE_ITEMS,
        temple_total=TEMPLE_TOTAL,
        thevaramadam_items=THEVARAMADAM_ITEMS,
        thevaramadam_total=THEVARAMADAM_TOTAL,
        sreemoolam_items=SREEMOOLAM_ITEMS,
        sreemoolam_total=SREEMOOLAM_TOTAL,
        kalari_items=KALARI_ITEMS,
        kalari_total=KALARI_TOTAL,
        nakshatra_trees=NAKSHATRA_TREES,
        current_year=datetime.now().year,
    )


@app.errorhandler(429)
def ratelimit_handler(e):
    return {"error": "too many requests, slow down"}, 429


@app.errorhandler(500)
def internal_error(e):
    # never leak stack trace / internals to client, even if DEBUG misconfigured
    logger.exception("Unhandled server error")
    return {"error": "internal server error"}, 500


if __name__ == "__main__":
    app.run(
        debug=app.config["DEBUG"],
        host=os.environ.get("HOST", "127.0.0.1"),  # 0.0.0.0 only in containers behind a proxy
        port=int(os.environ.get("PORT", 5000)),
    )
