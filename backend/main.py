from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import networkx as nx
import io

# ==========================================
# FINANCIAL FORENSIC ENGINE - BACKEND
# Team: The Cyber-Detectives (Student Project)
# ==========================================

# We are using FastAPI because it's fast and easy to learn.
app = FastAPI()

# This is needed so our React frontend can talk to this Python backend.
# Without CORS, the browser blocks the connection for security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow anyone (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------
# HELPER FUNCTIONS (The Logic)
# ------------------------------------------

def build_graph(df):
    """
    This function takes the spreadsheet data (DataFrame) and turns it into a mathematical Graph.
    Nodes = Bank Accounts
    Edges = Money Transfers
    """
    # Create an empty Directed Graph (Direction matters: A -> B is different from B -> A)
    G = nx.DiGraph()
    
    # Loop through every row in the CSV
    for _, row in df.iterrows():
        # Add an edge from Sender to Receiver with the amount
        G.add_edge(row['sender_id'], row['receiver_id'], 
                   amount=row['amount'], 
                   timestamp=row['timestamp'],
                   transaction_id=row['transaction_id'])
    return G

def detect_smurfing(G):
    """
    Detects 'Smurfing' or 'Mule Accounts'.
    Logic: If an account has WAY more connections than everyone else, it's suspicious.
    In Graph Theory, this is called 'Degree Centrality'.
    """
    # Get a dictionary of degrees (how many connections each node has)
    degree_dict = dict(G.degree())
    
    if not degree_dict:
        return []
        
    # Sort accounts by number of connections (highest first)
    sorted_nodes = sorted(degree_dict.items(), key=lambda item: item[1], reverse=True)
    
    # We decided that the top 5% of busy accounts are "Mules"
    # This is a simple heuristic for our prototype.
    top_5_percent_index = int(len(sorted_nodes) * 0.05)
    threshold_value = sorted_nodes[top_5_percent_index][1] if len(sorted_nodes) > 20 else 0
    
    # Find everyone above that threshold (must have at least 3 transactions to count)
    mule_accounts = []
    for account, degree in degree_dict.items():
        if degree >= max(threshold_value, 3):
            mule_accounts.append(account)
            
    return mule_accounts

def detect_cycles(G):
    """
    Detects 'Structuring' or 'Layering' loops.
    Logic: If money goes A -> B -> C -> A, that's a cycle.
    Honest people usually don't send money in circles!
    """
    suspicious_cycles = []
    try:
        # We use 'Strongly Connected Components' (SCC) to find groups of nodes that are all stuck in a loop together.
        # This is much faster than checking every single path.
        sccs = list(nx.strongly_connected_components(G))
        
        for component in sccs:
            # If a component has more than 1 node, it means there is a cycle involved!
            if len(component) > 1:
                # We extract the subgraph to look closer
                subgraph = G.subgraph(component)
                try:
                    # Just find one example cycle to show as proof
                    cycle_edges = nx.find_cycle(subgraph)
                    # Extract the list of account names involved
                    cycle_nodes = [u for u, v in cycle_edges]
                    suspicious_cycles.append(cycle_nodes)
                except:
                    pass # Sometimes it fails if the graph is weird
            
            # Special Case: Self-loop (A -> A)
            elif len(component) == 1:
                node = list(component)[0]
                if G.has_edge(node, node):
                    suspicious_cycles.append([node])
                    
        return suspicious_cycles
    except Exception as e:
        print(f"Oops, cycle detection crashed: {e}")
        return []

def score_risk(node, is_mule, is_in_cycle):
    """
    Calculates a simple risk score (0-100).
    """
    score = 10 # Base risk
    
    if is_mule:
        score += 40 # Mules are high risk
    if is_in_cycle:
        score += 50 # Cycles are VERY high risk (money laundering)
        
    return score

# ------------------------------------------
# API ENDPOINTS (The Web Part)
# ------------------------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Endpoint for uploading a custom CSV file.
    """
    # Read the file content into memory
    contents = await file.read()
    # Decode logic because sometimes files are weird
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    # Make sure it has the right columns!
    required_cols = {'sender_id', 'receiver_id', 'amount', 'timestamp'}
    if not required_cols.issubset(df.columns):
        return {"error": "Bad CSV format! We need sender_id, receiver_id, amount, timestamp."}
        
    return perform_analysis(df)

@app.get("/sample-data")
def get_sample_data():
    """
    Returns the pre-generated fake fraud data for the demo.
    """
    try:
        df = pd.read_csv("sample_fraud.csv")
        return perform_analysis(df)
    except Exception as e:
        return {"error": f"Could not load sample data: {str(e)}"}

def perform_analysis(df):
    """
    The Main logic driver.
    1. Build Graph
    2. Find Bad Guys
    3. Return Data for Frontend
    """
    G = build_graph(df)
    
    # Run our detection algorithms
    mules = detect_smurfing(G)
    cycles = detect_cycles(G)
    
    # Convert cycle list (list of lists) into a flat set of bad account names
    cycle_participants = set()
    for cycle in cycles:
        cycle_participants.update(cycle)
        
    # Prepare the list of nodes (accounts) with their risk scores
    node_list = []
    all_accounts = list(G.nodes())
    
    for account in all_accounts:
        is_mule = account in mules
        is_in_cycle = account in cycle_participants
        
        # Calculate risk
        risk = score_risk(account, is_mule, is_in_cycle)
        
        # Add flags (Explanations for the UI)
        flags = []
        if is_mule:
            flags.append("High Volume (Mule?)")
        if is_in_cycle:
            flags.append("Circular Flow")
            
        # Add to our list
        node_list.append({
            "id": account,
            "risk_score": risk,
            "flags": flags,
            # Visual stuff for the graph
            "val": risk / 10, # Bigger nodes = higher risk
            "color": "#ef4444" if risk > 50 else "#3b82f6" # Red = Danger, Blue = Safe
        })
        
    # Prepare list of links (transactions)
    link_list = []
    for u, v, data in G.edges(data=True):
        link_list.append({
            "source": u,
            "target": v,
            "amount": data['amount']
        })
        
    # Return everything as a dictionary (JSON)
    return {
        "nodes": node_list,
        "links": link_list,
        "risk_summary": sorted([n for n in node_list if n['risk_score'] > 20], key=lambda x: x['risk_score'], reverse=True)
    }

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
