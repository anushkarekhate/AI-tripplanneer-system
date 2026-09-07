# ==============================
# SMARTROUTE CITY DATA
# ==============================

CITY_GRAPH = {

    "Amravati": {
        "Nagpur": 155,
        "Wardha": 110,
        "Aurangabad": 390,
        "Pune": 650
    },

    "Nagpur": {
        "Amravati": 155,
        "Wardha": 80
    },

    "Wardha": {
        "Amravati": 110,
        "Nagpur": 80
    },

    "Aurangabad": {
        "Amravati": 390,
        "Pune": 235,
        "Nashik": 200
    },

    "Pune": {
        "Amravati": 650,
        "Aurangabad": 235,
        "Mumbai": 150,
        "Goa": 450,
        "Nashik": 210
    },

    "Mumbai": {
        "Pune": 150,
        "Nashik": 165
    },

    "Nashik": {
        "Mumbai": 165,
        "Pune": 210,
        "Aurangabad": 200
    },

    "Goa": {
        "Pune": 450
    }
}


# Approximate travel time in hours

TRAVEL_TIME = {

    ("Amravati", "Nagpur"): 3.5,
    ("Amravati", "Wardha"): 2.5,
    ("Amravati", "Aurangabad"): 7,
    ("Amravati", "Pune"): 11.5,

    ("Nagpur", "Amravati"): 3.5,
    ("Nagpur", "Wardha"): 2,

    ("Wardha", "Amravati"): 2.5,
    ("Wardha", "Nagpur"): 2,

    ("Aurangabad", "Amravati"): 7,
    ("Aurangabad", "Pune"): 5,
    ("Aurangabad", "Nashik"): 4,

    ("Pune", "Amravati"): 11.5,
    ("Pune", "Aurangabad"): 5,
    ("Pune", "Mumbai"): 3.5,
    ("Pune", "Goa"): 9,
    ("Pune", "Nashik"): 4,

    ("Mumbai", "Pune"): 3.5,
    ("Mumbai", "Nashik"): 4,

    ("Nashik", "Mumbai"): 4,
    ("Nashik", "Pune"): 4,
    ("Nashik", "Aurangabad"): 4,

    ("Goa", "Pune"): 9
}


# Approximate transport price per kilometer

TRANSPORT_RATE = {

    "Budget": 2.5,
    "Standard": 4,
    "Luxury": 7
}