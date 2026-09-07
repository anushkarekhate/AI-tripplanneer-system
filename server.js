const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const astar = require("./astar");

const app = express();

app.use(cors());
app.use(express.json());

// Load hotel data
let hotelsData = {};
try {
    const raw = fs.readFileSync(path.join(__dirname, "hotels.json"), "utf8");
    hotelsData = JSON.parse(raw);
} catch (e) {
    console.error("Failed to load hotels.json", e);
}

const nodes = {
    Amravati: { x: 0, y: 0 },
    Nagpur: { x: 5, y: 2 },
    Wardha: { x: 3, y: 4 },
    Pune: { x: 10, y: 8 },
    Mumbai: { x: 14, y: 10 },
    Nashik: { x: 11, y: 6 },
    Aurangabad: { x: 8, y: 5 },
    Goa: { x: 12, y: 14 }
};

const graph = {
    Amravati: [
        { node: "Nagpur", cost: 5 },
        { node: "Wardha", cost: 5 }
    ],
    Nagpur: [
        { node: "Amravati", cost: 5 },
        { node: "Wardha", cost: 4 },
        { node: "Aurangabad", cost: 7 }
    ],
    Wardha: [
        { node: "Amravati", cost: 5 },
        { node: "Nagpur", cost: 4 },
        { node: "Aurangabad", cost: 6 }
    ],
    Aurangabad: [
        { node: "Nagpur", cost: 7 },
        { node: "Wardha", cost: 6 },
        { node: "Pune", cost: 5 },
        { node: "Nashik", cost: 4 }
    ],
    Pune: [
        { node: "Aurangabad", cost: 5 },
        { node: "Mumbai", cost: 5 },
        { node: "Goa", cost: 7 }
    ],
    Nashik: [
        { node: "Aurangabad", cost: 4 },
        { node: "Mumbai", cost: 4 }
    ],
    Mumbai: [
        { node: "Pune", cost: 5 },
        { node: "Nashik", cost: 4 }
    ],
    Goa: [
        { node: "Pune", cost: 7 }
    ]
};

const transportRates = {
    Budget: 2.5,
    Standard: 4,
    Luxury: 7
};

app.get("/", (req, res) => {
    res.send("AI Trip Planner Node.js Backend Running");
});

app.get("/locations", (req, res) => {
    res.json(Object.keys(nodes));
});

const handlePlanTrip = (req, res) => {
    const {
        start = "Amravati",
        destination = "Pune",
        budget = "Standard",
        days = 3,
        travelers = 1,
        interest = "culture"
    } = req.body || {};

    if (!nodes[start] || !nodes[destination]) {
        return res.status(400).json({ error: "Invalid location" });
    }

    const result = astar(graph, nodes, start, destination);

    if (!result) {
        return res.status(404).json({ error: "Route not found" });
    }

    const distanceKm = Math.round(result.distance * 35);
    const estHours = (distanceKm / 50).toFixed(1);
    const estimatedTime = `${estHours} hrs`;

    // Tier mapping
    const tierMap = { low: "Budget", medium: "Standard", high: "Luxury" };
    let budgetTier = tierMap[(budget || "").toLowerCase()] || budget;
    if (!["Budget", "Standard", "Luxury"].includes(budgetTier)) {
        budgetTier = "Standard";
    }

    const rate = transportRates[budgetTier] || 4;
    const transportCost = Math.round(distanceKm * rate * travelers);

    const cityHotels = hotelsData[destination] || {};
    const hotelInfo = cityHotels[budgetTier] || {
        name: `${destination} City Hotel`,
        price: budgetTier === "Luxury" ? 6500 : (budgetTier === "Budget" ? 1500 : 3000),
        rating: 4.2,
        location: destination
    };

    const numDays = parseInt(days) || 3;
    const numTravelers = parseInt(travelers) || 1;

    const hotelCost = hotelInfo.price * numDays;
    const foodCost = 500 * numDays * numTravelers;
    const totalCost = transportCost + hotelCost + foodCost;

    res.json({
        success: true,
        algorithm: "A* Search Algorithm",
        start,
        destination,
        route: result.path,
        distance: distanceKm,
        distance_km: distanceKm,
        time: estimatedTime,
        estimated_time: estimatedTime,
        budget: budgetTier,
        days: numDays,
        travelers: numTravelers,
        interest,
        cost: {
            transport: transportCost,
            hotel: hotelCost,
            food: foodCost,
            total: totalCost
        },
        price: totalCost,
        hotel: hotelInfo,
        recommendation: `AI recommends exploring ${interest} attractions along your route.`
    });
};

app.post("/plan-trip", handlePlanTrip);
app.post("/api/plan-trip", handlePlanTrip);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 AI Trip Planner running on http://localhost:${PORT}`);
});