import requests
import json

print("\n--- Testing Static Simulation ---")
url_static = "http://localhost:8000/simulate"
payload_static = {
    "model_id": "iML1515",
    "method": "fba",
    "carbon_source": "glc__D",
    "uptake_rate": 10.0,
    "aerobic": True,
    "knockouts": [],
    "overexpressions": {}
}
try:
    print("Sending request to backend...")
    response = requests.post(url_static, json=payload_static, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(f"Growth rate: {data.get('growth_rate')}")
        print(f"Fluxes count: {len(data.get('fluxes', {}))}")
    else:
        print("Error:", response.text)
except Exception as e:
    print(f"Request failed: {e}")


print("\n--- Testing Dynamic Simulation ---")
url = "http://localhost:8000/simulate-dynamic"
payload = {
    "model_id": "iML1515",
    "initial_glucose": 20.0,
    "initial_biomass": 0.1,
    "total_time": 24,
    "time_step": 1.0,
    "knockouts": [],
    "include_flux_history": True
}

try:
    print("Sending request to backend...")
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(f"Time points: {len(data.get('time', []))}")
        print(f"Flux history count: {len(data.get('flux_history', []))}")
    else:
        print("Error:", response.text)
except Exception as e:
    print(f"Request failed: {e}")
