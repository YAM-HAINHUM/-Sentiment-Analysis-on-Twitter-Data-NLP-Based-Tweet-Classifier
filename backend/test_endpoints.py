import requests

print("Test 1: /analyze (protected, no token)")
r = requests.post('http://localhost:8000/analyze', 
  json={'text': 'This is great!'},
  headers={'Origin': 'http://localhost:5173'})
print(f"Status: {r.status_code}")
cors = r.headers.get('access-control-allow-origin', 'NONE')
print(f"CORS: {cors}")
if r.status_code != 200:
    print(f"Error Response: {r.text[:500]}")

print("\nTest 2: /analyze/public (no auth needed)")
r = requests.post('http://localhost:8000/analyze/public', 
  json={'text': 'This is great!'},
  headers={'Origin': 'http://localhost:5173'})
print(f"Status: {r.status_code}")
cors = r.headers.get('access-control-allow-origin', 'NONE')
print(f"CORS: {cors}")
if r.status_code == 200:
    print(f"Result: {r.json()['sentiment']}")
else:
    print(f"Error: {r.text[:300]}")
