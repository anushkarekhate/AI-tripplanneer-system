// =========================================================
// SMART AI TRIP PLANNER - GPS & MICROPHONE SYSTEM INTEGRATION
// =========================================================

let isListening = false;
let recognitionInstance = null;

const CITY_COORDS = {
    Amravati: { lat: 20.9374, lon: 77.7796 },
    Nagpur: { lat: 21.1458, lon: 79.0882 },
    Wardha: { lat: 20.7453, lon: 78.6022 },
    Pune: { lat: 18.5204, lon: 73.8567 },
    Mumbai: { lat: 19.0760, lon: 72.8777 },
    Nashik: { lat: 19.9975, lon: 73.7898 },
    Aurangabad: { lat: 19.8762, lon: 75.3433 },
    Goa: { lat: 15.2993, lon: 74.1240 }
};

function getVal(id, fallback = "") {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
}

function setTxt(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

// =========================================================
// 1. LIVE GPS LOCATION DETECTION SYSTEM
// =========================================================

function detectGPSLocation() {
    const coordsText = document.getElementById("gpsCoordsText");
    const gpsBadge = document.getElementById("gpsStatusBadge");

    if (coordsText) {
        coordsText.style.display = "block";
        coordsText.innerText = "📡 Fetching GPS coordinates...";
    }

    if (!("geolocation" in navigator)) {
        alert("Geolocation is not supported by your browser. Defaulting to Amravati.");
        if (coordsText) coordsText.innerText = "📍 Default: Amravati";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            // Find nearest city hub using Haversine formula
            let nearestCity = "Amravati";
            let minDistance = Infinity;

            for (const [city, coords] of Object.entries(CITY_COORDS)) {
                const dist = haversineDistance(userLat, userLon, coords.lat, coords.lon);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestCity = city;
                }
            }

            const startEl = document.getElementById("start");
            if (startEl) startEl.value = nearestCity;

            if (coordsText) {
                coordsText.innerText = `📍 Lat: ${userLat.toFixed(2)}°, Lon: ${userLon.toFixed(2)}° → Nearest Hub: ${nearestCity}`;
            }

            if (gpsBadge) {
                gpsBadge.style.display = "inline-block";
                gpsBadge.innerText = `📍 GPS: ${nearestCity}`;
            }

            speak(`GPS location detected. Nearest starting hub is set to ${nearestCity}.`);
        },
        (error) => {
            console.warn("GPS error or permission denied:", error.message);
            const startEl = document.getElementById("start");
            if (startEl) startEl.value = "Amravati";

            if (coordsText) {
                coordsText.innerText = "📍 GPS Permission Denied. Defaulted to Amravati.";
            }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// =========================================================
// 2. MICROPHONE VOICE INPUT ASSISTANT SYSTEM
// =========================================================

function toggleMicrophoneSystem() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Microphone voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
        return;
    }

    const micBadge = document.getElementById("micStatusBadge");
    const navBtn = document.getElementById("navVoiceBtn");

    if (isListening && recognitionInstance) {
        recognitionInstance.stop();
        isListening = false;
        if (micBadge) micBadge.style.display = "none";
        if (navBtn) navBtn.innerText = "🎙️ Mic Assistant";
        setTxt("status", "Mic Stopped");
        return;
    }

    recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = "en-IN";
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    recognitionInstance.onstart = function () {
        isListening = true;
        if (micBadge) {
            micBadge.style.display = "inline-block";
            micBadge.innerText = "🎙️ Listening...";
        }
        if (navBtn) navBtn.innerText = "🛑 Stop Listening";
        setTxt("status", "🎙️ Listening for commands...");
    };

    recognitionInstance.onresult = function (event) {
        const text = event.results[0][0].transcript.toLowerCase();
        setTxt("status", `You said: "${text}"`);

        // Parse voice commands
        parseVoiceCommands(text);
        planTrip();
    };

    recognitionInstance.onerror = function (event) {
        console.error("Mic recognition error:", event.error);
        setTxt("status", "Mic Error");
        isListening = false;
        if (micBadge) micBadge.style.display = "none";
        if (navBtn) navBtn.innerText = "🎙️ Mic Assistant";
    };

    recognitionInstance.onend = function () {
        isListening = false;
        if (micBadge) micBadge.style.display = "none";
        if (navBtn) navBtn.innerText = "🎙️ Mic Assistant";
    };

    recognitionInstance.start();
}

function parseVoiceCommands(text) {
    const cities = ["amravati", "nagpur", "wardha", "pune", "mumbai", "nashik", "aurangabad", "goa"];

    // Check for destination or start
    cities.forEach(city => {
        if (text.includes("from " + city) || text.includes("start " + city)) {
            const startEl = document.getElementById("start");
            if (startEl) startEl.value = city.charAt(0).toUpperCase() + city.slice(1);
        } else if (text.includes("to " + city) || text.includes("visit " + city) || text.includes(city)) {
            const destEl = document.getElementById("destination");
            if (destEl) destEl.value = city.charAt(0).toUpperCase() + city.slice(1);
        }
    });

    // Check budget
    if (text.includes("luxury") || text.includes("premium")) {
        const bEl = document.getElementById("budget");
        if (bEl) bEl.value = "Luxury";
    } else if (text.includes("budget") || text.includes("cheap")) {
        const bEl = document.getElementById("budget");
        if (bEl) bEl.value = "Budget";
    }

    // Check days
    const matchDays = text.match(/(\d+)\s*day/);
    if (matchDays && matchDays[1]) {
        const daysEl = document.getElementById("days");
        if (daysEl) daysEl.value = matchDays[1];
    }
}

// =========================================================
// 3. TRIP PLANNING & BACKEND FETCHING
// =========================================================

async function planTrip() {
    const start = getVal("start", "Amravati");
    const destination = getVal("destination", "Pune");
    const budget = getVal("budget", "Standard");
    const days = parseInt(getVal("days", "3")) || 3;
    const travelers = parseInt(getVal("travelers", "1")) || 1;
    const interest = getVal("travelType", "culture");

    setTxt("status", "🤖 AI Processing...");

    try {
        let res;
        try {
            res = await fetch("http://127.0.0.1:5000/api/plan-trip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start, destination, budget, days, travelers, interest })
            });
        } catch (fetchErr) {
            res = await fetch("http://127.0.0.1:5000/plan-trip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start, destination, budget, days, travelers, interest })
            });
        }

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Unable to plan trip");
            setTxt("status", "❌ Error Planning Trip");
            return;
        }

        const distanceStr = (data.distance_km || data.distance || 0) + " km";
        const timeStr = data.estimated_time || data.time || "N/A";
        const algoStr = data.algorithm || "A* Search Algorithm";

        setTxt("distance", distanceStr);
        setTxt("time", timeStr);
        setTxt("algorithm", algoStr);

        const totalCostVal = data.cost && data.cost.total !== undefined ? data.cost.total : (data.price || 0);

        setTxt("price", "₹" + Number(totalCostVal).toLocaleString());

        if (data.cost) {
            setTxt("transportCost", "₹" + Number(data.cost.transport || 0).toLocaleString());
            setTxt("hotelCost", "₹" + Number(data.cost.hotel || 0).toLocaleString());
            setTxt("foodCost", "₹" + Number(data.cost.food || 0).toLocaleString());
            setTxt("totalCost", "₹" + Number(data.cost.total || 0).toLocaleString());
        }

        const routeArr = data.route || [];
        setHtml("routeResult", `
            <div class="route-box">
                <p style="font-size: 1.1em; font-weight: bold;">📍 ${routeArr.join(" → ")}</p>
                <p>🛣️ Distance: ${distanceStr}</p>
                <p>⏱️ Travel Time: ${timeStr}</p>
            </div>
        `);

        const hotel = data.hotel || {
            name: "Recommended Stay",
            location: destination,
            rating: 4.5,
            price: 2500
        };

        setHtml("hotelResult", `
            <div class="hotel-card">
                <h4 style="margin: 5px 0;">🏨 ${hotel.name}</h4>
                <p>📍 Location: ${hotel.location}</p>
                <p>⭐ Rating: ${hotel.rating} / 5</p>
                <p>💰 Price: ₹${Number(hotel.price).toLocaleString()} / night</p>
                <button class="voice-btn" style="margin-top: 8px;" onclick="speakHotel()">🔊 Hear Hotel Info</button>
            </div>
        `);

        setTxt("weatherResult", `☀️ Clear skies expected in ${destination} during your trip.`);
        setTxt("recommendationResult", data.recommendation || `AI recommends exploring top ${interest} spots in ${destination}.`);

        setTxt("status", "✅ Trip Optimized");

        const resSec = document.getElementById("result");
        if (resSec) resSec.scrollIntoView({ behavior: "smooth" });

        speak(
            `Trip from ${start} to ${destination} optimized. Total estimated cost is ${totalCostVal} rupees. Recommended hotel is ${hotel.name}.`
        );

    } catch (err) {
        alert("Cannot connect to backend server at http://127.0.0.1:5000. Please start server.js or app.py!");
        console.error(err);
        setTxt("status", "❌ Backend Offline");
    }
}

function generateTrip() {
    planTrip();
}

function swapLocations() {
    const startEl = document.getElementById("start");
    const destEl = document.getElementById("destination");
    if (startEl && destEl) {
        const temp = startEl.value;
        startEl.value = destEl.value;
        destEl.value = temp;
    }
}

function scrollToPlanner() {
    const el = document.getElementById("planner");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

// =========================================================
// INTERACTIVE FEATURE MODALS
// =========================================================

function closeModal() {
    const backdrop = document.getElementById("featureModal");
    if (backdrop) backdrop.style.display = "none";
}

function openFeature(featureId) {
    const backdrop = document.getElementById("featureModal");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");

    if (!backdrop || !titleEl || !bodyEl) return;

    backdrop.style.display = "flex";

    if (featureId === "ai-recommendations") {
        titleEl.innerText = "🧠 AI Recommendations Engine";
        bodyEl.innerHTML = `
            <p style="color:var(--text-muted); margin-bottom:15px;">AI curated top attractions based on trip preferences:</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div style="background:rgba(15,23,42,0.6); padding:12px 16px; border-radius:10px; border:1px solid var(--card-border);">
                    <h4 style="color:var(--primary);">🏛️ Historic Landmarks</h4>
                    <p style="font-size:0.85rem; color:#cbd5e1;">Aga Khan Palace (Pune), Gateway of India (Mumbai), Bibi Ka Maqbara (Aurangabad)</p>
                </div>
                <div style="background:rgba(15,23,42,0.6); padding:12px 16px; border-radius:10px; border:1px solid var(--card-border);">
                    <h4 style="color:var(--secondary);">🏖️ Nature & Beach Escapes</h4>
                    <p style="font-size:0.85rem; color:#cbd5e1;">Baga & Calangute Beaches (Goa), Sula Vineyards (Nashik), Chikhaldara Hill Station (Amravati)</p>
                </div>
                <div style="background:rgba(15,23,42,0.6); padding:12px 16px; border-radius:10px; border:1px solid var(--card-border);">
                    <h4 style="color:var(--accent);">🐅 Wildlife & Adventure</h4>
                    <p style="font-size:0.85rem; color:#cbd5e1;">Tadoba Tiger Reserve (Nagpur), Western Ghats Trekking (Pune)</p>
                </div>
            </div>
            <button class="generate-btn" style="margin-top:20px;" onclick="closeModal(); scrollToPlanner();">Apply to My Trip</button>
        `;
    } 
    else if (featureId === "astar") {
        titleEl.innerText = "🧭 A* Search Algorithm Interactive Visualizer";
        bodyEl.innerHTML = `
            <p style="color:var(--text-muted); margin-bottom:15px;">Graph search heuristic evaluation ($f(n) = g(n) + h(n)$):</p>
            <div style="background:rgba(15,23,42,0.6); padding:16px; border-radius:12px; border:1px solid var(--card-border); font-family:monospace; font-size:0.9rem;">
                <p>📍 Start Node: <strong>Amravati</strong> [x:0, y:0]</p>
                <p>➡️ Neighbor Evaluation:</p>
                <p style="color:#818cf8;">  ├─ Nagpur (Cost: 5, Heuristic: 12.8) -> f(n) = 17.8</p>
                <p style="color:#818cf8;">  └─ Wardha (Cost: 4, Heuristic: 10.2) -> f(n) = 14.2 (Optimal)</p>
                <p style="margin-top:10px; color:#34d399;">✅ Goal Found: <strong>Pune</strong> (Shortest Path: Amravati → Wardha → Aurangabad → Pune)</p>
            </div>
            <button class="generate-btn" style="margin-top:20px;" onclick="closeModal(); planTrip();">Run Optimization Now</button>
        `;
    } 
    else if (featureId === "weather") {
        const dest = getVal("destination", "Pune");
        titleEl.innerText = `🌦️ Live Weather Forecast - ${dest}`;
        bodyEl.innerHTML = `
            <div style="text-align:center; padding:10px;">
                <div style="font-size:3.5rem; margin-bottom:10px;">🌤️</div>
                <h2 style="font-size:2rem; font-weight:800;">28°C</h2>
                <p style="color:var(--text-muted); font-size:1rem; margin-bottom:20px;">Partly Cloudy in ${dest}</p>
                
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; background:rgba(15,23,42,0.6); padding:15px; border-radius:12px; border:1px solid var(--card-border);">
                    <div><small style="color:var(--text-muted);">Humidity</small><p style="font-weight:bold;">62%</p></div>
                    <div><small style="color:var(--text-muted);">Wind Speed</small><p style="font-weight:bold;">14 km/h</p></div>
                    <div><small style="color:var(--text-muted);">Precipitation</small><p style="font-weight:bold;">10%</p></div>
                </div>
            </div>
        `;
    } 
    else if (featureId === "voice") {
        closeModal();
        toggleMicrophoneSystem();
    } 
    else if (featureId === "gps") {
        closeModal();
        detectGPSLocation();
    } 
    else if (featureId === "chatbot") {
        titleEl.innerText = "💬 SmartTrip AI Travel Assistant";
        bodyEl.innerHTML = `
            <div class="chat-container">
                <div class="chat-messages" id="chatMsgs">
                    <div class="chat-msg bot">Hello! I am your AI Travel Assistant. How can I help you plan your trip today?</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Ask anything (e.g. Best time to visit Goa)..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()">Send</button>
                </div>
            </div>
        `;
    }
}

function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const msgs = document.getElementById("chatMsgs");
    if (!input || !msgs || !input.value.trim()) return;

    const txt = input.value.trim();
    input.value = "";

    const userDiv = document.createElement("div");
    userDiv.className = "chat-msg user";
    userDiv.innerText = txt;
    msgs.appendChild(userDiv);

    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
        const botDiv = document.createElement("div");
        botDiv.className = "chat-msg bot";

        const lower = txt.toLowerCase();
        if (lower.includes("goa")) {
            botDiv.innerText = "Goa is best visited between November and February for great beach weather and nightlife!";
        } else if (lower.includes("pune") || lower.includes("mumbai")) {
            botDiv.innerText = "The monsoon season (July to September) offers scenic drives along the Pune-Mumbai expressway!";
        } else if (lower.includes("budget") || lower.includes("cost") || lower.includes("price")) {
            botDiv.innerText = "Our A* algorithm optimizes transport, hotel stay, and food for Budget, Standard, or Luxury tiers!";
        } else {
            botDiv.innerText = "I have analyzed your request. Click 'Generate Smart Trip' to view optimized routes, hotel stays, and cost breakdowns!";
        }

        msgs.appendChild(botDiv);
        msgs.scrollTop = msgs.scrollHeight;
    }, 600);
}

// Text to Speech
function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
}

function speakHotel() {
    const el = document.getElementById("hotelResult");
    if (el) {
        speak(el.innerText);
    }
}