import google.generativeai as genai
from typing import Dict, Any
from src.rag_engine import WarehouseRAGEngine
import os

class WarehouseAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        # self.model_name = 'llama3' # Or 'llama2:13b' if installed (Commented out for Llama3)
        self.rag = WarehouseRAGEngine()
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('models/gemini-2.5-flash')
        else:
            self.model = None

    def reason(self, vehicle_data: Dict[str, Any]) -> str:
        """
        Calculates a decision using Gemini API (was Llama 3).
        """
        from src.database import get_complete_arrival_info
        
        plate = vehicle_data.get('plate')
        facts = get_complete_arrival_info(plate)
        facts_text = "No active pickup order found for this plate. Action: HOLD for manual verification."
        client_name = "Unknown"
        
        if facts:
            client_name = facts['client_nom']
            status = facts['commande_statut']
            if status == 'awaiting_pickup':
                facts_text = f"Vehicle {facts.get('plaque_vehicule', plate)} for client {client_name}. Product: {facts['produit_nom']}. Status: AWAITING_PICKUP - Ready for collection."
            elif status == 'picked_up':
                facts_text = f"Vehicle {facts.get('plaque_vehicule', plate)} for client {client_name}. Status: ALREADY PICKED UP - Order was already collected."
            else:
                facts_text = f"Vehicle {facts.get('plaque_vehicule', plate)} for client {client_name}. Status: {status}."

        search_query = f"Consignes pour le client {client_name}"
        context_chunks = self.rag.query(search_query, n_results=5)
        context_text = "\n---\n".join(context_chunks)

        prompt = f"""
        You are the Warehouse Intelligence Agent for a PICKUP-ONLY warehouse.
        Clients arrive to collect their pre-ordered goods.
        
        FACTS: {facts_text}
        RULES: {context_text}
        VEHICLE: {plate} at {vehicle_data.get('time')}
        
        Status meanings:
        - awaiting_pickup: Order is ready, client can proceed to gate for pickup
        - picked_up: Order already collected
        
        Mandatory: Respond ONLY with a JSON object.
        Template:
        {{
            "analysis": "Explanation of your decision",
            "gate": "D-01 to E-05",
            "priority": "LOW | MEDIUM | HIGH | CRITICAL",
            "action": "PICKUP | HOLD | REJECT"
        }}
        """

        if self.model:
            response = self.model.generate_content(prompt)
            return response.text
        else:
            return '{"analysis": "Error: Gemini API not configured", "gate": "N/A", "priority": "N/A", "action": "HOLD"}'

if __name__ == "__main__":
    # Example usage (requires GEMINI_API_KEY in .env)
    API_KEY = os.getenv("GEMINI_API_KEY")
    if not API_KEY:
        print("❌ Error: GEMINI_API_KEY not found in environment variables.")
    else:
        agent = WarehouseAgent(API_KEY)
        
        # Scenario: GlobalTech laptop delivery arrives (CRITICAL STOCK)
        mock_vehicle = {
            "plate": "302-502-TUN",
            "time": "10:15 AM"
        }
        
        print("\n🚛 Analyzing Warehouse Arrival...")
        result = agent.reason(mock_vehicle)
        print("\n--- AGENT INTELLIGENCE ---")
        print(result)
