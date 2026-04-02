#!/usr/bin/env python3
"""
Migration script: εισαγωγή δεδομένων από xlsx στο Supabase.
Τρέξε μία φορά: python migrate.py
"""
import json, sys
try:
    from supabase import create_client
except ImportError:
    print("pip install supabase")
    sys.exit(1)

SUPABASE_URL = "https://axjsewykbnvqlddxkgzn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4anNld3lrYm52cWxkZHhrZ3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjk1MDMsImV4cCI6MjA5MDY0NTUwM30.ZpL-X8p_y_0SdkJPWsS5PcmU4k694S-PPLR7nhMv03I"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

with open("migration_data.json", encoding="utf-8") as f:
    data = json.load(f)

def insert_batch(table, rows, batch=50):
    total = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        res = sb.table(table).upsert(chunk).execute()
        total += len(chunk)
        print(f"  {table}: {total}/{len(rows)}")
    return total

print("=== Migration Start ===")

# 1. Locations
print("\n1. Locations…")
insert_batch("locations", data["locations"])

# 2. Task types
print("\n2. Task types…")
insert_batch("task_types", data["task_types"])

# 3. Clients
print("\n3. Clients…")
insert_batch("clients", data["clients"])

# 4. Fetch IDs to link tasks
locs  = {r["name"]: r["id"] for r in sb.table("locations").select("id,name").execute().data}
types = {r["name"]: r["id"] for r in sb.table("task_types").select("id,name").execute().data}
cli   = {r["name"]: r["id"] for r in sb.table("clients").select("id,name").execute().data}
client_id = cli.get("ΧΑΡΑΛΑΜΠΟΣ ΘΕΟΔΟΣΗΣ ΑΒΕΕ")

# 5. Tasks — enrich with FK ids
print("\n4. Tasks…")
tasks = []
for t in data["tasks"]:
    t["location_id"]    = locs.get(t.get("location_name"))
    t["task_type_id"]   = types.get(t.get("task_type_name"))
    t["client_id"]      = client_id
    # fix None km/drive_hours
    if t.get("drive_km") == 0 and t.get("location_name"):
        loc_data = next((l for l in data["locations"] if l["name"] == t["location_name"]), None)
        if loc_data and loc_data.get("km"):
            pass  # keep 0 if explicitly 0
    tasks.append(t)

insert_batch("tasks", tasks, batch=50)

print("\n=== Migration Complete! ===")
print(f"Locations: {len(data['locations'])}")
print(f"Task types: {len(data['task_types'])}")
print(f"Tasks: {len(data['tasks'])}")
