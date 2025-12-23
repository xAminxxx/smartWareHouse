import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.vision import VisionPipeline
from src.agent import WarehouseAgent
from dotenv import load_dotenv
import datetime

load_dotenv()

app = FastAPI(title="SmartWarehouse AI API")

# CORS setup for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_PATH = "smartALPR_best.pt"

if not API_KEY:
    print("⚠️ Warning: GEMINI_API_KEY not found in .env")

vision = VisionPipeline(MODEL_PATH, API_KEY)
agent = WarehouseAgent(API_KEY)

@app.post("/process-entrance")
async def process_entrance(file: UploadFile = File(...)):
    """
    End-to-end flow: Image -> OCR -> RAG Reasoning -> Decision
    """
    try:
        # Read image
        image_bytes = await file.read()
        
        # 1. Vision Layer: OCR to get Plate
        plate_number = vision.extract_plate_number(image_bytes)
        
        if not plate_number:
            return {
                "status": "error",
                "message": "No license plate detected in the image.",
                "decision": "HOLD",
                "analysis": "Vehicle arrived but plate recognition failed. Manual check required."
            }

        print(f"✅ Plate Detected: {plate_number}")

        # 2. Reasoning Layer: RAG + Agent Decision
        current_time = datetime.datetime.now().strftime("%I:%M %p")
        analysis = agent.reason({"plate": plate_number, "time": current_time})

        # 3. Action Layer: Update SQL Database based on detection
        # (Automation: If an order is found, we mark it as 'Processing')
        from src.database import get_complete_arrival_info, update_order_status
        facts = get_complete_arrival_info(plate_number)
        
        if facts and 'idCommande' in facts:
            # Mark the order as Processing in MySQL
            update_order_status(facts['idCommande'], 'en cours')
            print(f"🔄 Auto-Update: Order for {plate_number} set to 'en cours'")

        return {
            "status": "success",
            "plate": plate_number,
            "analysis": analysis,
            "timestamp": current_time,
            "factual_data": facts
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Simple in-memory storage for chat history (For demo purposes)
chat_histories = {} 

@app.post("/chatbot-order")
async def chatbot_order(data: dict):
    try:
        user_message = data.get("message")
        session_id = data.get("session_id", "default")
        
        # Initialize history if new
        if session_id not in chat_histories:
            chat_histories[session_id] = []
        
        # 0. Get Warehouse Context
        from src.database import list_clients, list_products, create_new_order, create_new_client
        available_clients = list_clients()
        available_products = list_products()
        
        context_summary = f"""
        Available Clients: {', '.join(available_clients)}
        Available Products: {', '.join([p['name'] for p in available_products])}
        """

        # Append last messages for context
        history_text = "\n".join(chat_histories[session_id][-6:]) # Keep last 6 messages

        # 1. Ask Ollama (Llama 3) to act as a conversational receptionist
        receptionist_prompt = f"""
        You are the SmartWarehouse Assistant. 
        Context: {context_summary}
        
        Recent History:
        {history_text}
        
        User Message: "{user_message}"
        
        IMPORTANT: Respond ONLY with a JSON object.
        Tasks:
        1. Respond politely. 
        2. If you see a name and it's NOT in the clients list, suggest registering.
        3. If you have all info (client + product + qty), set intent to "order".
        
        Output format:
        {{
            "response": "Your reply",
            "intent": "order" | "register" | "chat",
            "details": {{ "client": "name", "product": "name", "quantity": int, "new_client_name": "name" }}
        }}
        """
        
        import ollama
        ai_response = ollama.chat(model='llama3', messages=[
            {'role': 'user', 'content': receptionist_prompt}
        ])
        
        res_text = ai_response['message']['content']
        import json, re
        match = re.search(r'\{.*\}', res_text, re.DOTALL)
        if not match: return {"status": "error", "message": "Problème technique avec le modèle local."}
        
        decision = json.loads(match.group())
        intent = decision.get("intent")
        
        # Save to history
        chat_histories[session_id].append(f"User: {user_message}")
        chat_histories[session_id].append(f"AI: {decision['response']}")

        # --- EXECUTION ---
        if intent == "register" and decision["details"].get("new_client_name"):
            res = create_new_client(decision["details"]["new_client_name"])
            if res: return {"status": "success", "message": f"{decision['response']} (Compte créé)"}

        if intent == "order" and decision.get("details"):
            det = decision["details"]
            order_id = create_new_order(det.get('client'), det.get('product'), det.get('quantity'))
            if order_id: return {"status": "success", "message": f"{decision['response']} (Commande #{order_id} active)"}
            else: return {"status": "warning", "message": f"{decision['response']} (Erreur: Client ou Produit non trouvé)"}

        return {"status": "chat", "message": decision["response"]}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/health")
def health():
    # Check if vision and agent were initialized for a more accurate health check
    model_loaded = 'vision' in globals() and 'agent' in globals()
    return {"status": "online", "model_loaded": model_loaded}

if __name__ == "__main__":
    import uvicorn
    # Using 127.0.0.1 to avoid some Windows firewall/binding issues
    uvicorn.run(app, host="127.0.0.1", port=8000)
