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
        analysis_raw = agent.reason({"plate": plate_number, "time": current_time})
        
        import json, re
        match = re.search(r'\{.*\}', analysis_raw, re.DOTALL)
        if match:
            decision = json.loads(match.group())
        else:
            decision = {
                "analysis": analysis_raw,
                "gate": "N/A",
                "priority": "MEDIUM",
                "action": "HOLD"
            }

        # 3. Action Layer: Update SQL Database based on detection
        from src.database import get_complete_arrival_info, update_order_status
        facts = get_complete_arrival_info(plate_number)
        
        if facts and 'idCommande' in facts:
            update_order_status(facts['idCommande'], 'en cours')
            print(f"🔄 Auto-Update: Order for {plate_number} set to 'en cours'")

        return {
            "status": "success",
            "plate": plate_number,
            "decision": decision,
            "analysis": decision.get("analysis", ""),
            "timestamp": current_time,
            "factual_data": facts
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Database initialized on startup
from src.database import init_db
init_db()

@app.post("/chatbot-order")
async def chatbot_order(data: dict):
    try:
        user_message = data.get("message")
        session_id = data.get("session_id", "default")
        
        # 0. Get Warehouse Context & History
        from src.database import (
            list_clients, list_products, create_new_order, create_new_client,
            save_chat_message, get_chat_messages, create_chat_session,
            get_complete_arrival_info
        )
        
        available_clients = list_clients()
        available_products = list_products()
        
        detected_plate = data.get("detected_plate")
        order_info = None
        if detected_plate:
            order_info = get_complete_arrival_info(detected_plate)

        context_summary = f"""
        Available Clients: {', '.join(available_clients)}
        Available Products: {', '.join([p['name'] for p in available_products])}
        Detected Plate at Gate: {detected_plate or 'None'}
        Active Order For This Plate: {order_info if order_info else 'No active order found for this specific plate'}
        """
        
        # Determine Session
        user_id = data.get("user_id") 
        real_session_id = data.get("session_id")
        
        if not real_session_id:
            title = user_message[:30] + "..." if len(user_message) > 30 else user_message
            real_session_id = create_chat_session(user_id or 1, title) 
            
        history_msgs = get_chat_messages(real_session_id)
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history_msgs[-6:]])

        receptionist_prompt = f"""
        You are the SmartWarehouse Assistant. 
        Context: {context_summary}
        
        Recent History:
        {history_text}
        
        User Message: "{user_message}"
        
        IMPORTANT: Respond ONLY with a JSON object.
        Tasks:
        1. Respond politely. 
        2. If a vehicle is detected at the gate (see Plate in Context), and the user asks about it, check the "Active Order For This Plate" in context. If found, confirm details (Client, Product, Quantity) and ask if they are ready for pickup.
        3. If no order is found for the detected plate, inform the user and ask if they want to create a new order or if it's a different client.
        4. To pass a NEW order, you MUST have: Client Name, Product Name, Quantity (number), AND the Plate Number.
        5. If ALL info (client + product + quantity + plate) is present for a NEW order, set intent to "order".
        
        Output format:
        {{
            "response": "Your reply",
            "intent": "order" | "register" | "chat",
            "details": {{ "client": "name", "product": "name", "quantity": int, "plate": "string" }}
        }}
        """
        
        # import ollama
        # ai_response = ollama.chat(model='llama3', messages=[
        #     {'role': 'user', 'content': receptionist_prompt}
        # ])
        # res_text = ai_response['message']['content']

        # Using Gemini 1.5 Flash (via 'latest' alias)
        import google.generativeai as genai
        try:
            gemini_chat_model = genai.GenerativeModel('models/gemini-2.5-flash')
            response = gemini_chat_model.generate_content(receptionist_prompt)
            res_text = response.text
        except Exception as e:
            if "429" in str(e):
                return {"status": "error", "message": "Désolé, le quota gratuit de l'IA (Gemini Flash) est saturé. Veuillez patienter une minute."}
            raise e
        
        import json, re
        match = re.search(r'\{.*\}', res_text, re.DOTALL)
        if not match: return {"status": "error", "message": "Problème technique avec le modèle local/Gemini."}
        
        decision = json.loads(match.group())
        intent = decision.get("intent")
        
        # Save to DB
        save_chat_message(real_session_id, "user", user_message)
        save_chat_message(real_session_id, "ai", decision['response'])

        # --- EXECUTION ---
        if intent == "register" and decision["details"].get("new_client_name"):
            res = create_new_client(decision["details"]["new_client_name"])
            if res: return {"status": "success", "message": f"{decision['response']} (Compte créé)"}

        if intent == "order" and decision.get("details"):
            det = decision["details"]
            order_id = create_new_order(det.get('client'), det.get('product'), det.get('quantity'), det.get('plate'))
            if order_id: return {"status": "success", "message": f"{decision['response']} (Commande #{order_id} active)", "session_id": real_session_id}
            else: return {"status": "warning", "message": f"{decision['response']} (Erreur: Client ou Produit non trouvé)", "session_id": real_session_id}

        return {"status": "chat", "message": decision["response"], "session_id": real_session_id}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/inventory")
async def get_inventory():
    try:
        from src.database import list_products
        return list_products()
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/inventory")
async def create_product(data: dict):
    try:
        from src.database import add_product
        id_prod = add_product(data['name'], data['stock'], data['price'])
        return {"status": "success", "id": id_prod}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/inventory/{id_prod}")
async def edit_product(id_prod: int, data: dict):
    try:
        from src.database import update_product
        update_product(id_prod, data['name'], data['stock'], data['price'])
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/inventory/{id_prod}")
async def remove_product(id_prod: int):
    try:
        from src.database import delete_product
        delete_product(id_prod)
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/chat-sessions/{user_id}")
async def fetch_chat_sessions(user_id: int):
    try:
        from src.database import get_chat_sessions
        return get_chat_sessions(user_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/chat-messages/{session_id}")
async def fetch_chat_messages(session_id: int):
    try:
        from src.database import get_chat_messages
        return get_chat_messages(session_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/user/{email}")
async def fetch_user(email: str):
    try:
        from src.database import get_user_by_email
        return get_user_by_email(email)
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/update-password")
async def change_password(data: dict):
    try:
        from src.database import update_password
        update_password(data['user_id'], data['new_password'])
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/delete-account")
async def remove_account(data: dict):
    try:
        from src.database import delete_user
        delete_user(data['user_id'])
        return {"status": "success"}
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
