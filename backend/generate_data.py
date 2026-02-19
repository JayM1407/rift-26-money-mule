import pandas as pd
import random
import networkx as nx
from datetime import datetime, timedelta

def generate_fraud_data(num_nodes=50, num_tx=200):
    accounts = [f"ACC_{i:03d}" for i in range(num_nodes)]
    transactions = []
    
    start_time = datetime.now()
    
    # 1. Generate Normal Background Transactions
    for _ in range(num_tx):
        sender = random.choice(accounts)
        receiver = random.choice(accounts)
        while sender == receiver:
            receiver = random.choice(accounts)
            
        amount = round(random.uniform(10, 1000), 2)
        time_offset = random.randint(0, 86400) # Within 24 hours
        timestamp = start_time + timedelta(seconds=time_offset)
        
        transactions.append({
            "transaction_id": f"TX_{len(transactions):04d}",
            "sender_id": sender,
            "receiver_id": receiver,
            "amount": amount,
            "timestamp": timestamp
        })

    # 2. Inject Smurfing Pattern (Fan-In)
    # Mule account receives many small transactions then sends a large one
    mule = random.choice(accounts)
    smurfs = random.sample([a for a in accounts if a != mule], k=8)
    
    base_time = start_time + timedelta(hours=2)
    
    for i, smurf in enumerate(smurfs):
        amount = round(random.uniform(900, 990), 2) # Just under reporting threshold
        transactions.append({
            "transaction_id": f"TX_SMURF_{i}",
            "sender_id": smurf,
            "receiver_id": mule,
            "amount": amount,
            "timestamp": base_time + timedelta(minutes=random.randint(1, 10))
        })
        
    # Mule cash out
    target = random.choice([a for a in accounts if a != mule and a not in smurfs])
    transactions.append({
        "transaction_id": "TX_MULE_CASHOUT",
        "sender_id": mule,
        "receiver_id": target,
        "amount": 7500.00, # Large amount
        "timestamp": base_time + timedelta(minutes=15)
    })

    # 3. Inject Cycle (Structuring / Layering)
    # A -> B -> C -> A
    cycle_nodes = random.sample(accounts, 3)
    cycle_amount = 5000.00
    cycle_time = start_time + timedelta(hours=4)
    
    path = list(zip(cycle_nodes, cycle_nodes[1:] + [cycle_nodes[0]])) # (A,B), (B,C), (C,A)
    
    for i, (u, v) in enumerate(path):
        transactions.append({
            "transaction_id": f"TX_CYCLE_{i}",
            "sender_id": u,
            "receiver_id": v,
            "amount": cycle_amount,
            "timestamp": cycle_time + timedelta(minutes=i*5)
        })

    df = pd.DataFrame(transactions)
    df = df.sort_values("timestamp")
    df.to_csv("sample_fraud.csv", index=False)
    print(f"Generated sample_fraud.csv with {len(df)} transactions.")
    print(f"Smurfing Mule: {mule}")
    print(f"Cycle: {cycle_nodes}")

if __name__ == "__main__":
    generate_fraud_data()
