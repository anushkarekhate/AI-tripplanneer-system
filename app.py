import json
import math
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from data import CITY_GRAPH, TRAVEL_TIME, TRANSPORT_RATE

app = Flask(__name__)
CORS(app)

# Load hotel data
HOTELS_FILE = os.path.join(os.path.dirname(__file__), "hotels.json")
try:
    with open(HOTELS_FILE, "r") as f:
        HOTELS = json.load(f)
except Exception:
    HOTELS = {}

NODES = {
    "Amravati": {"x": 0, "y": 0},
    "Nagpur": {"x": 5, "y": 2},
    "Wardha": {"x": 3, "y": 4},
    "Pune": {"x": 10, "y": 8},
    "Mumbai": {"x": 14, "y": 10},
    "Nashik": {"x": 11, "y": 6},
    "Aurangabad": {"x": 8, "y": 5},
    "Goa": {"x": 12, "y": 14}
}

def heuristic(a, b):
    if a not in NODES or b not in NODES:
        return 0
    dx = NODES[a]["x"] - NODES[b]["x"]
    dy = NODES[a]["y"] - NODES[b]["y"]
    return math.sqrt(dx * dx + dy * dy)

def astar_search(start, goal):
    import heapq
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    
    all_nodes = set(list(CITY_GRAPH.keys()) + list(NODES.keys()))
    g_score = {node: float('inf') for node in all_nodes}
    f_score = {node: float('inf') for node in all_nodes}
    
    g_score[start] = 0
    f_score[start] = heuristic(start, goal)
    
    while open_set:
        _, current = heapq.heappop(open_set)
        if current == goal:
            path = []
            curr = current
            while curr in came_from:
                path.append(curr)
                curr = came_from[curr]
            path.append(start)
            path.reverse()
            return path, g_score[goal]
        
        for neighbor, weight in CITY_GRAPH.get(current, {}).items():
            tentative_g = g_score[current] + weight
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))
                
    return None, 0

@app.route("/", methods=["GET"])
def home():
    return "AI Trip Planner Flask Backend Running"

@app.route("/locations", methods=["GET"])
def get_locations():
    return jsonify(list(NODES.keys()))

@app.route("/plan-trip", methods=["POST"])
@app.route("/api/plan-trip", methods=["POST"])
def plan_trip():
    data = request.get_json() or {}
    start = data.get("start", "Amravati")
    destination = data.get("destination", "Pune")
    budget = data.get("budget", "Standard")
    days = int(data.get("days", 3))
    travelers = int(data.get("travelers", 1))
    interest = data.get("interest", "culture")

    # Normalize budget tier
    b_map = {"low": "Budget", "medium": "Standard", "high": "Luxury"}
    budget_tier = b_map.get(budget.lower(), budget)
    if budget_tier not in ["Budget", "Standard", "Luxury"]:
        budget_tier = "Standard"

    path, distance = astar_search(start, destination)
    if not path:
        return jsonify({"error": "Route not found"}), 404

    # Calculate travel time in hours
    est_hours = round(distance / 50.0, 1)
    time_str = f"{est_hours} hrs"

    # Calculate costs
    rate_per_km = TRANSPORT_RATE.get(budget_tier, 4)
    transport_cost = int(distance * rate_per_km * travelers)
    
    # Get hotel info
    city_hotels = HOTELS.get(destination, {})
    hotel_info = city_hotels.get(budget_tier, {
        "name": f"{destination} Grand Hotel",
        "price": 3000 if budget_tier == "Standard" else (1500 if budget_tier == "Budget" else 6500),
        "rating": 4.2,
        "location": destination
    })
    
    hotel_cost = int(hotel_info.get("price", 2500) * days)
    food_cost = int(500 * days * travelers)
    total_cost = transport_cost + hotel_cost + food_cost

    return jsonify({
        "success": True,
        "algorithm": "A* Search Algorithm",
        "start": start,
        "destination": destination,
        "route": path,
        "distance": distance,
        "distance_km": distance,
        "time": time_str,
        "estimated_time": time_str,
        "budget": budget_tier,
        "days": days,
        "travelers": travelers,
        "interest": interest,
        "cost": {
            "transport": transport_cost,
            "hotel": hotel_cost,
            "food": food_cost,
            "total": total_cost
        },
        "price": total_cost,
        "hotel": hotel_info,
        "recommendation": f"AI recommends top {interest} attractions along your route in {destination}."
    })

if __name__ == "__main__":
    print("🚀 AI Trip Planner Flask running on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)