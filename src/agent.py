import ollama
from typing import Dict, Any
from src.rag_engine import WarehouseRAGEngine

class WarehouseAgent:
    def __init__(self, api_key: str = None):
        # We don't need the Gemini API key anymore for the Agent
        self.model_name = 'llama3' # Or 'llama2:13b' if installed
        self.rag = WarehouseRAGEngine()

    def reason(self, vehicle_data: Dict[str, Any]) -> str:
        """
        Calculates a decision using local Llama 3.
        """
        from src.database import get_complete_arrival_info
        
        plate = vehicle_data.get('plate')
        facts = get_complete_arrival_info(plate)
        facts_text = "Aucune commande active trouvée pour cette plaque."
        client_name = "Inconnu"
        
        if facts:
            client_name = facts['client_nom']
            facts_text = f"Camion {facts['camion_type']} pour le client {client_name}. Produit: {facts['produit_nom']}. Statut: {facts['commande_statut']}."

        search_query = f"Consignes pour le client {client_name}"
        context_chunks = self.rag.query(search_query, n_results=5)
        context_text = "\n---\n".join(context_chunks)

        prompt = f"""
        [INST] You are the Warehouse Intelligence Agent.
        Decide the course of action for this arrival.
        
        FACTS: {facts_text}
        RULES: {context_text}
        VEHICLE: {plate} at {vehicle_data.get('time')}
        
        Assign a Gate and Priority. [/INST]
        """

        response = ollama.chat(model=self.model_name, messages=[
            {'role': 'user', 'content': prompt}
        ])
        return response['message']['content']

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
