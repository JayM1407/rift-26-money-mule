from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import networkx as nx
import io
import time
from datetime import timedelta

# ==========================================
# FINANCIAL FORENSIC ENGINE - BACKEND
# Team: The Cyber-Detectives (RIFT 2026)
# ==========================================

app = FastAPI()

# CORS so our React frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------
# STEP 1: BUILD THE TRANSACTION GRAPH
# ------------------------------------------

def build_graph(df):
    """
    Turns the CSV spreadsheet into a Directed Graph.
    Nodes = Bank Accounts, Edges = Transactions
    """
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(
            row['sender_id'], row['receiver_id'],
            amount=row['amount'],
            timestamp=row['timestamp'],
            transaction_id=row['transaction_id']
        )
    return G

# ------------------------------------------
# STEP 2: DETECTION ALGORITHMS
# ------------------------------------------

def detect_cycles(G):
    """
    Finds money going in circles (A -> B -> C -> A).
    Uses Strongly Connected Components (SCC) - much faster than brute force.
    Returns: list of cycles (each cycle = list of nodes) and a node->ring_id mapping.
    """
    suspicious_cycles = []
    node_to_ring = {}  # maps each account to its ring ID

    try:
        sccs = list(nx.strongly_connected_components(G))

        ring_counter = 1
        for component in sccs:
            if len(component) > 1:
                ring_id = f"RING_{ring_counter:03d}"
                ring_counter += 1

                subgraph = G.subgraph(component)
                try:
                    cycle_edges = nx.find_cycle(subgraph)
                    cycle_nodes = list(component)  # use full SCC membership
                    suspicious_cycles.append({
                        "ring_id": ring_id,
                        "nodes": cycle_nodes
                    })
                    for n in cycle_nodes:
                        node_to_ring[n] = ring_id
                except:
                    pass

            elif len(component) == 1:
                node = list(component)[0]
                if G.has_edge(node, node):
                    ring_id = f"RING_{ring_counter:03d}"
                    ring_counter += 1
                    suspicious_cycles.append({
                        "ring_id": ring_id,
                        "nodes": [node]
                    })
                    node_to_ring[node] = ring_id

        return suspicious_cycles, node_to_ring

    except Exception as e:
        print(f"Cycle detection error: {e}")
        return [], {}


def detect_high_velocity(G, df):
    """
    High Velocity: Money leaves an account within 15 minutes of arriving.
    This is a sign of a 'pass-through' mule account used to quickly move money.
    """
    high_velocity_accounts = set()

    try:
        # Parse timestamps so we can do time math
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
    except Exception as e:
        print(f"Timestamp parsing failed: {e}")
        return high_velocity_accounts

    for account in G.nodes():
        # Get all times money arrived at this account
        incoming_times = df[df['receiver_id'] == account]['timestamp'].tolist()
        # Get all times money left this account
        outgoing_times = df[df['sender_id'] == account]['timestamp'].tolist()

        if not incoming_times or not outgoing_times:
            continue

        # Check: for any incoming, is there an outgoing within 15 minutes?
        for in_time in incoming_times:
            window_end = in_time + timedelta(minutes=15)
            for out_time in outgoing_times:
                if in_time <= out_time <= window_end:
                    high_velocity_accounts.add(account)
                    break
            if account in high_velocity_accounts:
                break

    return high_velocity_accounts


def calculate_suspicion_score(account, G, is_in_cycle, is_high_velocity):
    """
    Multi-Factor Heuristic Scoring (0-100):
      +50 if part of a detected cycle (Topology)
      +5 per unique sender beyond 5, capped at 30 (Smurfing)
      +20 if High Velocity account (Temporal)
    """
    score = 0

    # Factor 1: Cycle involvement - the most suspicious pattern
    if is_in_cycle:
        score += 50

    # Factor 2: Smurfing / Hub detection (in-degree > 5)
    in_degree = G.in_degree(account)
    if in_degree > 5:
        # +5 per extra sender, capped at 30
        smurf_bonus = min((in_degree - 5) * 5, 30)
        score += smurf_bonus

    # Factor 3: High velocity (temporal analysis)
    if is_high_velocity:
        score += 20

    return min(score, 100)  # Cap at 100

# ------------------------------------------
# STEP 3: MAIN ANALYSIS FUNCTION
# ------------------------------------------

def perform_analysis(df):
    """
    Orchestrates the full analysis pipeline:
    1. Build graph
    2. Find cycles (fraud rings)
    3. Find high velocity accounts
    4. Score every account
    5. Return structured data for the frontend
    """
    start_time = time.time()
    G = build_graph(df)

    # Run detection algorithms
    cycles, node_to_ring = detect_cycles(G)
    high_velocity_set = detect_high_velocity(G, df)

    # Get all nodes in cycles
    cycle_participants = set(node_to_ring.keys())

    # Score every account
    node_list = []
    all_accounts = list(G.nodes())

    for account in all_accounts:
        is_in_cycle = account in cycle_participants
        is_hv = account in high_velocity_set

        # Calculate score using our heuristic model
        score = calculate_suspicion_score(account, G, is_in_cycle, is_hv)

        # Build detected pattern labels
        patterns = []
        if is_in_cycle:
            patterns.append("cycle")
        if G.in_degree(account) > 5:
            patterns.append("smurfing")
        if is_hv:
            patterns.append("layering")

        node_list.append({
            "id": account,
            "suspicion_score": score,
            "risk_score": score,   # alias for compatibility
            "flags": patterns,
            "patterns": patterns,
            "ring_id": node_to_ring.get(account, "N/A"),
            # Visual: node size = score, color = danger level
            "val": max(score / 8, 1.5),
            "color": "#ef4444" if score > 70 else ("#f97316" if score > 40 else "#3b82f6")
        })

    # Build fraud rings summary
    fraud_rings = []
    for cycle_info in cycles:
        ring_members = cycle_info["nodes"]
        ring_scores = [n["suspicion_score"] for n in node_list if n["id"] in ring_members]
        avg_risk = round(sum(ring_scores) / len(ring_scores), 2) if ring_scores else 0

        # Determine dominant pattern type
        patterns_in_ring = []
        for n in node_list:
            if n["id"] in ring_members:
                patterns_in_ring.extend(n["patterns"])
        if "smurfing" in patterns_in_ring and "cycle" in patterns_in_ring:
            pattern_type = "hybrid"
        elif "layering" in patterns_in_ring:
            pattern_type = "layering"
        else:
            pattern_type = "cycle"

        fraud_rings.append({
            "ring_id": cycle_info["ring_id"],
            "member_accounts": ring_members,
            "pattern_type": pattern_type,
            "risk_score": avg_risk
        })

    # Prepare links (transactions)
    link_list = []
    for u, v, data in G.edges(data=True):
        link_list.append({
            "source": u,
            "target": v,
            "amount": data['amount']
        })

    processing_time = time.time() - start_time

    # Sorted risk summary (top accounts for Evidence Locker)
    risk_summary = sorted(
        [n for n in node_list if n['suspicion_score'] > 20],
        key=lambda x: x['suspicion_score'],
        reverse=True
    )

    return {
        "nodes": node_list,
        "links": link_list,
        "fraud_rings": fraud_rings,
        "risk_summary": risk_summary,
        "summary": {
            "total_accounts_analyzed": len(all_accounts),
            "suspicious_accounts_flagged": len([n for n in node_list if n['suspicion_score'] > 20]),
            "fraud_rings_detected": len(fraud_rings),
            "processing_time_seconds": round(processing_time, 4)
        }
    }

# ------------------------------------------
# API ENDPOINTS
# ------------------------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a custom CSV file for analysis."""
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

    required_cols = {'sender_id', 'receiver_id', 'amount', 'timestamp'}
    if not required_cols.issubset(df.columns):
        return {"error": "Bad CSV format! Need: sender_id, receiver_id, amount, timestamp, transaction_id"}

    return perform_analysis(df)


@app.get("/sample-data")
def get_sample_data():
    """Returns the pre-generated sample fraud dataset."""
    try:
        df = pd.read_csv("sample_fraud.csv")
        return perform_analysis(df)
    except Exception as e:
        return {"error": f"Could not load sample data: {str(e)}"}


@app.get("/report")
def download_report():
    """
    Returns a formatted report.json matching the exact RIFT-2026 schema.
    Sorted by suspicion score descending.
    """
    try:
        start_time = time.time()
        df = pd.read_csv("sample_fraud.csv")
        result = perform_analysis(df)
        processing_time = time.time() - start_time

        # Build exact schema
        report = {
            "suspicious_accounts": [
                {
                    "account_id": node["id"],
                    "suspicion_score": float(node["suspicion_score"]),
                    "detected_patterns": node["patterns"],
                    "ring_id": node.get("ring_id", "N/A")
                }
                for node in sorted(result["nodes"], key=lambda x: x["suspicion_score"], reverse=True)
                if node["suspicion_score"] > 0
            ],
            "fraud_rings": result["fraud_rings"],
            "summary": {
                "total_accounts_analyzed": result["summary"]["total_accounts_analyzed"],
                "suspicious_accounts_flagged": result["summary"]["suspicious_accounts_flagged"],
                "fraud_rings_detected": result["summary"]["fraud_rings_detected"],
                "processing_time_seconds": round(processing_time, 4)
            }
        }

        return report

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
