# RIFT-26: Money Muling Detection Engine 🛡️⛓️

**Live Demo:** [rift26.netlify.app](https://rift-cyber-kage.netlify.app/) | **Backend API:** (https://rift-26-money-mule.onrender.com)

## What It Does
RIFT ingests financial transaction CSVs and automatically detects organized money muling rings using Graph Theory.

| Pattern | Detection Method | Score |
| :--- | :--- | :--- |
| **Circular Wash** | Strongly Connected Components (SCC) | +50 pts |
| **Smurfing** | Fan-in > 5 unique senders | +5 pts/sender, cap 30 |
| **High Velocity** | Money exits within 15 min of arrival | +20 pts |

Results are visualized as an interactive force graph — node size and color map directly to suspicion score, and accounts scoring >70 pulse with a red glow.

## Stack
| Layer | Tech |
| :--- | :--- |
| **Frontend** | React + Vite + Tailwind CSS |
| **Graph viz** | react-force-graph-2d |
| **Backend** | FastAPI + NetworkX + pandas |
| **Hosting** | Netlify (frontend) + Render (backend) |

---

## Project Structure
```text
rift-2026/
├── backend/
│   ├── main.py            # FastAPI app — scoring engine, API routes
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   └── LabPage.jsx      # Main dashboard + upload + polling
│   │   └── components/
│   │       ├── GraphView.jsx    # Force graph with score-based styling
│   │       ├── EvidenceLocker.jsx # Top 10 suspects sidebar
│   │       ├── FraudRingTable.jsx # Fraud Ring Intelligence table
│   │       └── DropZone.jsx       # CSV upload
│   └── index.html
└── README.md     # Plain-English writeup for judges
