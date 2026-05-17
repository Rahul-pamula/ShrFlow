import requests
from requests.auth import HTTPBasicAuth

url = "https://lionfish.rmq.cloudamqp.com/api/consumers"
auth = HTTPBasicAuth("hiktokxl", "JW1xJJYGbIw8-ED7lsLmCDnmh9ojBPxg")

response = requests.get(url, auth=auth)
if response.status_code == 200:
    consumers = response.json()
    bulk_email_consumers = [c for c in consumers if c.get("queue", {}).get("name") == "bulk_email_queue"]
    print(f"Total consumers on bulk_email_queue: {len(bulk_email_consumers)}")
    for i, c in enumerate(bulk_email_consumers):
        print(f"Consumer {i+1}: Channel={c.get('channel_details', {}).get('name')}, Peer Host={c.get('channel_details', {}).get('peer_host')}")
else:
    print(f"Failed to fetch: {response.status_code} {response.text}")
