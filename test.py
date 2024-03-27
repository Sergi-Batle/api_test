import requests

r = requests.get('http://127.0.0.1:8001/v1/ingest/list')

print(r.content)