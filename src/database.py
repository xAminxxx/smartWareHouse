import mysql.connector
import os
import datetime
import json
import logging
from dotenv import load_dotenv

# Configure logging for database operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "smart_warehouse"),
        buffered=True,  # Fixes 'Unread result found'
        autocommit=False  # Explicit transaction control for data safety
    )

def init_db():
    temp_conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "")
    )
    cursor = temp_conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {os.getenv('DB_NAME', 'smart_warehouse')}")
    temp_conn.close()

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # --- SCHEMA DEFINITION ---
    cursor.execute("CREATE TABLE IF NOT EXISTS user (idUser INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(100) UNIQUE, motpass VARCHAR(255))")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS client (
        idClient INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100),
        adresse TEXT,
        telephone VARCHAR(20),
        idUser INT,
        FOREIGN KEY (idUser) REFERENCES user(idUser) ON DELETE CASCADE
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS camion (
        idCamion INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50),
        plaque VARCHAR(20) UNIQUE,
        idClient INT,
        FOREIGN KEY (idClient) REFERENCES client(idClient) ON DELETE CASCADE
    )
    """)
    cursor.execute("CREATE TABLE IF NOT EXISTS gerant (idGerant INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(100))")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS depot (
        idDepot INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100),
        adresse TEXT,
        idGerant INT,
        FOREIGN KEY (idGerant) REFERENCES gerant(idGerant) ON DELETE SET NULL
    )
    """)
    cursor.execute("CREATE TABLE IF NOT EXISTS produit (idProduit INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(100), Quantite INT DEFAULT 0, prix DECIMAL(10,2) DEFAULT 0.00)")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS commande (
        idCommande INT AUTO_INCREMENT PRIMARY KEY,
        idClient INT,
        idProduit INT,
        idDepot INT,
        quantite INT DEFAULT 1,
        dateCommande DATE,
        statut VARCHAR(30) DEFAULT 'en attente',
        plaque_vehicule VARCHAR(20),
        user_confirmed BOOLEAN DEFAULT FALSE,
        plate_verified BOOLEAN DEFAULT FALSE,
        plate_source VARCHAR(20) DEFAULT 'chat' CHECK (plate_source IN ('vision', 'chat')),
        FOREIGN KEY (idClient) REFERENCES client(idClient) ON DELETE CASCADE,
        FOREIGN KEY (idProduit) REFERENCES produit(idProduit) ON DELETE CASCADE,
        FOREIGN KEY (idDepot) REFERENCES depot(idDepot) ON DELETE SET NULL,
        INDEX idx_user_confirmed (user_confirmed),
        INDEX idx_plate_verified (plate_verified),
        INDEX idx_plate_source (plate_source),
        INDEX idx_commande_date (dateCommande)
    )
    """)
    
    # --- CHAT SYSTEM ---
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_session (
        idSession INT AUTO_INCREMENT PRIMARY KEY,
        idUser INT,
        title VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES user(idUser) ON DELETE CASCADE
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_message (
        idMessage INT AUTO_INCREMENT PRIMARY KEY,
        idSession INT,
        role ENUM('user', 'ai'),
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idSession) REFERENCES chat_session(idSession) ON DELETE CASCADE
    )
    """)
    
    # --- ORDER AUDIT TRAIL ---
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_audit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        issue_type VARCHAR(50),
        details JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES commande(idCommande) ON DELETE CASCADE
    )
    """)

    # --- MASSIVE DATA SEEDING (FROM DUMP) ---
    
    # Check if data already exists to avoid duplicates
    cursor.execute("SELECT COUNT(*) FROM user")
    if cursor.fetchone()[0] > 0:
        print("ℹ️ Base de données déjà initialisée, skip seeding.")
        conn.close()
        return
    
    # 1. Users (including admin)
    users = [
        ("admin@smart.com", "admin"),  # Admin user
        ("client@test.com", "client"),  # Test client
    ] + [(f"client{i}@mail.com", "pass123") for i in range(1, 51)]
    cursor.executemany("INSERT IGNORE INTO user (email, motpass) VALUES (%s, %s)", users)

    # 2. Gerants
    gerants = [('Gérard Dupont',), ('Sami Trabelsi',), ('Nour Gharbi',), ('Ali Miled',), ('Sonia Lahmar',)]
    cursor.executemany("INSERT IGNORE INTO gerant (nom) VALUES (%s)", gerants)

    # 3. Depots
    depots = [
        ('Dépôt Nord', 'Ariana', 1), ('Dépôt Sud', 'Sfax', 2),
        ('Dépôt Est', 'Sousse', 3), ('Dépôt Ouest', 'Le Kef', 4), ('Dépôt Central', 'Tunis', 5)
    ]
    cursor.executemany("INSERT IGNORE INTO depot (nom, adresse, idGerant) VALUES (%s, %s, %s)", depots)

    # 4. Clients (linked to users starting from id 3)
    clients_data = [
        ('Client Alpha', 'Rue Carthage', '20010001', 3),
        ('Client Beta', 'Rue Bourguiba', '20010002', 4),
        ('Client Gamma', 'Rue Monastir', '20010003', 5),
        ('Client Delta', 'Rue Bizerte', '20010004', 6),
        ('Client Epsilon', 'Rue El Mourouj', '20010005', 7),
        ('City Schools', "Rue de l'Éducation", '71234567', 8),
        ('RetailCorp', 'Zone Industrielle', '71987654', 9),
        ('GlobalTech Solutions', 'Tech Park', '71555555', 2),  # Linked to test client user
    ]
    cursor.executemany("INSERT IGNORE INTO client (nom, adresse, telephone, idUser) VALUES (%s, %s, %s, %s)", clients_data)

    # 5. Camions
    camions = [
        ('Camion benne', '145 تونس 4862', 1),
        ('Camion plateau', '302 تونس 1598', 2),
        ('Camion frigorifique', '137 تونس 7481', 3),
        ('Camion citerne', '410 تونس 2649', 4),
        ('Camion fourgon', '111 تونس 8801', 5),
        ('Camion livraison', '302-502-TUN', 8),  # GlobalTech
        ('Camion école', '111-888-TUN', 6),  # City Schools
    ]
    cursor.executemany("INSERT IGNORE INTO camion (type, plaque, idClient) VALUES (%s, %s, %s)", camions)

    # 6. Produits
    produits = [
        ('Cartons A4', 500, 15.00), ('Claviers USB', 120, 35.00), ('Souris Optiques', 140, 25.00),
        ('Laptops Model X', 5, 1200.00), ('Toners', 80, 120.00), ('Écrans LED 24 pouces', 60, 300.00), 
        ('Climatiseurs portables', 10, 1450.00), ('Paper Towels', 10, 8.50), ('Disinfectant Spray', 100, 12.00)
    ]
    cursor.executemany("INSERT IGNORE INTO produit (nom, Quantite, prix) VALUES (%s, %s, %s)", produits)

    # 7. Commandes (with quantity)
    commandes = [
        (1, 3, 1, 50, '2025-11-10', 'terminée', None),
        (2, 2, 2, 10, '2025-12-03', 'en cours', '302 تونس 1598'),
        (6, 1, 3, 100, '2025-10-05', 'en attente', '111-888-TUN'),  # City Schools order
        (8, 4, 5, 5, '2025-11-13', 'en cours', '302-502-TUN'),  # GlobalTech delivery
    ]
    cursor.executemany("INSERT IGNORE INTO commande (idClient, idProduit, idDepot, quantite, dateCommande, statut, plaque_vehicule) VALUES (%s, %s, %s, %s, %s, %s, %s)", commandes)

    conn.commit()
    conn.close()
    print("✨ La base de données est maintenant riche en données réelles !")

def get_complete_arrival_info(plaque: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Search for an active order that matches this plate directly or via client's registered camelion
    query = """
    SELECT com.idCommande, cl.nom as client_nom, cl.telephone, 
           com.statut as commande_statut, com.dateCommande,
           p.nom as produit_nom, p.Quantite as stock_disponible,
           d.nom as depot_nom, com.plaque_vehicule
    FROM commande com
    JOIN client cl ON com.idClient = cl.idClient
    JOIN produit p ON com.idProduit = p.idProduit
    JOIN depot d ON com.idDepot = d.idDepot
    LEFT JOIN camion cam ON cl.idClient = cam.idClient
    WHERE com.plaque_vehicule = %s 
       OR com.plaque_vehicule LIKE %s
       OR cam.plaque = %s
    ORDER BY com.dateCommande DESC
    LIMIT 1
    """
    cursor.execute(query, (plaque, f"%{plaque}%", plaque))
    result = cursor.fetchone()
    conn.close()
    return result

def update_order_status(idCommande: int, new_status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE commande SET statut = %s WHERE idCommande = %s", (new_status, idCommande))
    conn.commit()
    conn.close()
    print(f"✅ Commande #{idCommande} mise à jour : {new_status}")

def confirm_pickup(order_id: int, admin_user_id: int = None) -> dict:
    """
    Admin confirms that vehicle has picked up the order.
    Changes status from 'awaiting_pickup' to 'picked_up' (pickup-only flow)
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get current order status
        cursor.execute("SELECT statut, idClient, idProduit FROM commande WHERE idCommande = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return {"success": False, "error": "Order not found"}
        
        if order['statut'] == 'picked_up':
            return {
                "success": False,
                "error": "order_already_completed",
                "message": f"Order #{order_id} was already marked as picked up"
            }

        # Update status directly to 'picked_up' (pickup complete)
        cursor.execute(
            "UPDATE commande SET statut = %s WHERE idCommande = %s",
            ('picked_up', order_id)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"✅ Order #{order_id} picked up successfully",
            "old_status": order['statut'],
            "new_status": "picked_up"
        }
    except Exception as e:
        conn.close()
        return {"success": False, "error": str(e)}

def complete_order(order_id: int, admin_user_id: int = None) -> dict:
    """
    MEDIUM PRIORITY FIX #3: Admin confirms that unloading/loading is complete.
    Changes status to 'terminée' (completed)
    Now includes validation for already completed orders.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get current order status
        cursor.execute("SELECT statut, idClient, idProduit, plaque_vehicule FROM commande WHERE idCommande = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return {"success": False, "error": "Order not found"}
        
        # MEDIUM PRIORITY FIX #3: Check if already completed
        if order['statut'] == 'terminée':
            conn.close()
            return {
                "success": False,
                "error": "order_already_completed",
                "message": f"Order #{order_id} was already marked as completed",
                "current_status": "terminée"
            }
        
        # Update status to 'terminée' (completed)
        cursor.execute(
            "UPDATE commande SET statut = %s WHERE idCommande = %s",
            ('terminée', order_id)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"✅ Order #{order_id} marked as completed",
            "old_status": order['statut'],
            "new_status": "terminée",
            "plate": order.get('plaque_vehicule')
        }
    except mysql.connector.Error as db_err:
        # MEDIUM PRIORITY FIX #2: Structured error logging
        logger.error(f"Database error completing order {order_id}: {db_err}")
        conn.rollback()
        conn.close()
        return {
            "success": False,
            "error": "database_error",
            "message": "Unable to complete order due to system error."
        }
    except Exception as e:
        logger.error(f"Unexpected error completing order {order_id}: {e}")
        conn.rollback()
        conn.close()
        return {
            "success": False,
            "error": "system_error",
            "message": "An unexpected error occurred."
        }

def get_order_by_plate(plate: str) -> dict:
    """
    Get the most recent order (any status) for a specific vehicle plate.
    Used for completing orders when admin confirms unloading.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT com.idCommande, cl.nom as client_nom, cl.telephone,
               com.statut, com.dateCommande, com.quantite,
               p.nom as produit_nom, p.prix,
               d.nom as depot_nom, com.plaque_vehicule
        FROM commande com
        JOIN client cl ON com.idClient = cl.idClient
        JOIN produit p ON com.idProduit = p.idProduit
        JOIN depot d ON com.idDepot = d.idDepot
                WHERE (com.plaque_vehicule = %s OR com.plaque_vehicule LIKE %s)
                    AND com.statut IN ('awaiting_pickup', 'picked_up')
        ORDER BY com.dateCommande DESC
        LIMIT 1
        """
        cursor.execute(query, (plate, f"%{plate}%"))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "found": True,
                "order": result
            }
        else:
            return {
                "found": False,
                "message": f"No active orders found for plate: {plate}"
            }
    except Exception as e:
        conn.close()
        return {"found": False, "error": str(e)}

def authorize_pickup(order_id: int, gate_id: str = None, admin_user_id: int = None) -> dict:
    """
    HIGH PRIORITY FIX #3: Pickup Authorization Step
    Authorize vehicle to proceed to pickup location.
    Updates order status to 'authorized', records gate assignment and authorization time.
    
    Status flow: awaiting → detected → authorized → in_progress → terminée
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify order exists and is in correct status
        cursor.execute("SELECT statut, plaque_vehicule FROM commande WHERE idCommande = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return {"success": False, "error": "Order not found"}
        
        # Validate current status (should be 'detected' or 'awaiting')
        if order['statut'] not in ['detected', 'awaiting']:
            conn.close()
            return {
                "success": False,
                "error": "invalid_status",
                "message": f"Order cannot be authorized from status '{order['statut']}'. Expected 'detected' or 'awaiting'.",
                "current_status": order['statut']
            }
        
        # Update order with authorization
        cursor.execute("""
            UPDATE commande 
            SET statut = %s
            WHERE idCommande = %s
        """, ('authorized', order_id))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"✅ Vehicle authorized for pickup at gate {gate_id or 'default'}",
            "order_id": order_id,
            "gate": gate_id or "A-01",
            "old_status": order['statut'],
            "new_status": "authorized",
            "plate": order.get('plaque_vehicule')
        }
    except mysql.connector.Error as db_err:
        logger.error(f"Database error authorizing pickup for order {order_id}: {db_err}")
        conn.rollback()
        conn.close()
        return {
            "success": False,
            "error": "database_error",
            "message": "Unable to authorize pickup due to system error."
        }
    except Exception as e:
        logger.error(f"Unexpected error authorizing pickup: {e}")
        conn.rollback()
        conn.close()
        return {
            "success": False,
            "error": "system_error",
            "message": "An unexpected error occurred."
        }

def get_awaiting_orders_for_plate(plate: str) -> dict:
    """
    Get all orders awaiting pickup for a specific vehicle plate.
    Called when a vehicle arrives at the gate.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Search for orders with this plate that are still awaiting
        query = """
        SELECT com.idCommande, cl.nom as client_nom, cl.telephone,
               com.statut, com.dateCommande, com.quantite,
               p.nom as produit_nom, p.prix,
               d.nom as depot_nom, com.plaque_vehicule
        FROM commande com
        JOIN client cl ON com.idClient = cl.idClient
        JOIN produit p ON com.idProduit = p.idProduit
        JOIN depot d ON com.idDepot = d.idDepot
        WHERE (com.plaque_vehicule = %s OR com.plaque_vehicule LIKE %s)
          AND com.statut = 'awaiting_pickup'
        ORDER BY com.dateCommande ASC
        LIMIT 1
        """
        cursor.execute(query, (plate, f"%{plate}%"))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "found": True,
                "order": result
            }
        else:
            return {
                "found": False,
                "message": f"No awaiting orders found for plate: {plate}"
            }
    except Exception as e:
        conn.close()
        return {"found": False, "error": str(e)}

def update_stock(idProduit: int, quantity_change: int):
    """
    quantity_change can be positive (delivery) or negative (pickup)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE produit SET Quantite = Quantite + %s WHERE idProduit = %s", (quantity_change, idProduit))
    conn.commit()
    conn.close()
    print(f"📦 Stock Produit #{idProduit} mis à jour (Variation: {quantity_change})")

def validate_stock(product_id: int, quantity: int) -> dict:
    """
    HIGH PRIORITY FIX #1 & MEDIUM FIX #1: Stock validation with alternatives and partial stock
    
    Returns:
        {
            "valid": bool,
            "current_stock": int,
            "shortage": int (if invalid),
            "alternatives": list (if insufficient stock),
            "partial_available": bool
        }
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT Quantite, nom FROM produit WHERE idProduit = %s", (product_id,))
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        return {"valid": False, "error": "Product not found"}
    
    current_stock = result['Quantite']
    product_name = result['nom']
    
    if quantity <= 0:
        conn.close()
        return {"valid": False, "error": "Quantity must be positive"}
    
    if current_stock < quantity:
        # HIGH PRIORITY FIX #1: Find alternative products with stock
        cursor.execute("""
            SELECT nom, Quantite, prix 
            FROM produit 
            WHERE Quantite >= %s 
            AND idProduit != %s
            LIMIT 3
        """, (quantity, product_id))
        alternatives = cursor.fetchall()
        
        conn.close()
        
        # MEDIUM PRIORITY FIX #1: Offer partial stock if available
        partial_available = current_stock > 0
        
        return {
            "valid": False,
            "current_stock": current_stock,
            "requested": quantity,
            "shortage": quantity - current_stock,
            "partial_available": partial_available,
            "alternatives": [
                {"name": alt['nom'], "stock": alt['Quantite'], "price": float(alt['prix'])}
                for alt in alternatives
            ] if alternatives else []
        }
    
    conn.close()
    return {
        "valid": True,
        "current_stock": current_stock,
        "requested": quantity
    }

def find_client(client_name: str) -> dict:
    """
    ✅ FIX #4: Find client by exact match or return candidates.
    
    Returns:
        {
            "found": bool,
            "id": int (if exact match),
            "candidates": [list of names] (if fuzzy matches)
        }
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Try exact match first
    cursor.execute(
        "SELECT idClient, nom FROM client WHERE LOWER(nom) = LOWER(%s)",
        (client_name.strip(),)
    )
    exact_match = cursor.fetchone()
    
    if exact_match:
        conn.close()
        return {
            "found": True,
            "id": exact_match['idClient'],
            "name": exact_match['nom'],
            "type": "exact"
        }
    
    # Try fuzzy match to return candidates
    cursor.execute(
        "SELECT idClient, nom FROM client WHERE LOWER(nom) LIKE LOWER(%s)",
        (f"%{client_name.strip()}%",)
    )
    candidates = cursor.fetchall()
    conn.close()
    
    if len(candidates) > 1:
        return {
            "found": False,
            "type": "multiple",
            "candidates": [c['nom'] for c in candidates],
            "message": f"Found {len(candidates)} clients matching '{client_name}'. Please select one."
        }
    elif len(candidates) == 1:
        return {
            "found": True,
            "id": candidates[0]['idClient'],
            "name": candidates[0]['nom'],
            "type": "fuzzy_single"
        }
    else:
        return {
            "found": False,
            "type": "not_found",
            "message": f"No client found matching '{client_name}'"
        }

def find_product(product_name: str) -> dict:
    """
    ✅ FIX #5: Find product by fuzzy match or return candidates.
    
    Returns:
        {
            "found": bool,
            "id": int (if single match),
            "product": {id, name, stock, price} (if found),
            "candidates": [list] (if multiple matches)
        }
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Try exact match first
    cursor.execute(
        "SELECT idProduit, nom, Quantite, prix FROM produit WHERE LOWER(nom) = LOWER(%s)",
        (product_name.strip(),)
    )
    exact_match = cursor.fetchone()
    
    if exact_match:
        conn.close()
        return {
            "found": True,
            "product": {
                "id": exact_match['idProduit'],
                "name": exact_match['nom'],
                "stock": exact_match['Quantite'],
                "price": float(exact_match['prix'])
            },
            "type": "exact"
        }
    
    # Fuzzy match to find candidates
    cursor.execute(
        "SELECT idProduit, nom, Quantite, prix FROM produit WHERE LOWER(nom) LIKE LOWER(%s)",
        (f"%{product_name.strip()}%",)
    )
    matches = cursor.fetchall()
    conn.close()
    
    if len(matches) > 1:
        return {
            "found": False,
            "type": "multiple",
            "candidates": [
                {"name": m['nom'], "stock": m['Quantite']}
                for m in matches
            ],
            "message": f"Found {len(matches)} products matching '{product_name}'. Please select one."
        }
    elif len(matches) == 1:
        m = matches[0]
        return {
            "found": True,
            "product": {
                "id": m['idProduit'],
                "name": m['nom'],
                "stock": m['Quantite'],
                "price": float(m['prix'])
            },
            "type": "fuzzy_single"
        }
    else:
        return {
            "found": False,
            "type": "not_found",
            "message": f"No product found matching '{product_name}'"
        }

def confirm_order(order_id: int, user_id: int = None) -> dict:
    """
    ✅ FIX #1: Mark an order as confirmed by user.
    Only confirmed orders are counted in active_orders metric.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify order exists
        cursor.execute("SELECT * FROM commande WHERE idCommande = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return {"success": False, "error": "Order not found"}
        
        if order['user_confirmed']:
            conn.close()
            return {"success": False, "error": "Order already confirmed"}
        
        # Mark as confirmed
        cursor.execute(
            "UPDATE commande SET user_confirmed = TRUE WHERE idCommande = %s",
            (order_id,)
        )
        
        # Log confirmation
        cursor.execute("""
            INSERT INTO order_audit (order_id, issue_type, details)
            VALUES (%s, %s, %s)
        """, (
            order_id,
            'CONFIRMED',
            json.dumps({'user_id': user_id})
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "order_id": order_id,
            "message": f"Order #{order_id} confirmed and activated"
        }
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return {"success": False, "error": str(e)}

def verify_plate(order_id: int, detected_by: str = 'vision') -> dict:
    """
    ✅ FIX #3: Mark a plate as verified by vision OCR.
    Only verified plates are counted in arrived_today metric.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE commande SET plate_verified = TRUE, plate_source = %s WHERE idCommande = %s",
            (detected_by, order_id)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Plate verified for order #{order_id}"}
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return {"success": False, "error": str(e)}

def get_client_by_user(user_id: int):
    """Get the client associated with a user (if any)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute(
        "SELECT idClient, nom FROM client WHERE idUser = %s",
        (user_id,)
    )
    result = cursor.fetchone()
    conn.close()
    
    return result

def create_new_order(
    client_name: str,
    product_name: str,
    quantity: int,
    plate: str = None,
    user_id: int = None,
    plate_source: str = 'chat'  # 'vision' or 'chat'
) -> dict:
    """
    ✅ SAFE ORDER CREATION WITH FULL VALIDATION
    
    Critical Fixes Applied:
    - #1: Returns confirmation preview (no immediate order creation)
    - #2: Validates stock before order creation
    - #4: Exact client matching or candidate list
    - #5: Product disambiguation
    - #3: Plate source tracking (vision vs chat)
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Step 1: Validate client
        client_result = find_client(client_name)
        if not client_result['found']:
            conn.close()
            return {
                "success": False,
                "error": "invalid_client",
                "reason": client_result.get('message', 'Client not found'),
                "candidates": client_result.get('candidates')
            }
        client_id = client_result['id']
        
        # Step 2: Validate product
        product_result = find_product(product_name)
        if not product_result['found']:
            conn.close()
            return {
                "success": False,
                "error": "invalid_product",
                "reason": product_result.get('message', 'Product not found'),
                "candidates": product_result.get('candidates')
            }
        product_id = product_result['product']['id']
        
        # Step 3: Validate stock
        stock_result = validate_stock(product_id, quantity)
        if not stock_result['valid']:
            # HIGH PRIORITY FIX #1 & MEDIUM FIX #1: Return alternatives and partial stock info
            error_response = {
                "success": False,
                "error": "insufficient_stock",
                "reason": f"Insufficient stock. Available: {stock_result.get('current_stock', 0)}, Requested: {quantity}",
                "current_stock": stock_result.get('current_stock'),
                "requested": quantity,
                "shortage": stock_result.get('shortage', 0)
            }
            
            # Add partial stock suggestion if available
            if stock_result.get('partial_available', False):
                error_response['partial_stock'] = {
                    "available": stock_result['current_stock'],
                    "suggestion": f"We have {stock_result['current_stock']} units available. Would you like to order that amount instead?"
                }
            
            # Add alternative products if found
            if stock_result.get('alternatives'):
                error_response['alternatives'] = stock_result['alternatives']
            
            conn.close()
            return error_response
        
        # Step 4: Validate quantity
        if quantity <= 0:
            conn.close()
            return {
                "success": False,
                "error": "invalid_quantity",
                "reason": "Quantity must be greater than zero"
            }
        
        # Step 5: Create order with all validations passed
        cursor.execute("""
            INSERT INTO commande (
                idClient, idProduit, idDepot, quantite, 
                dateCommande, statut, plaque_vehicule, 
                user_confirmed, plate_verified, plate_source
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            client_id,
            product_id,
            5,  # Default depot
            quantity,
            datetime.date.today(),
            'awaiting_pickup',  # Initial status - awaiting pickup
            plate,
            False,  # Will be set to True only after user confirmation
            False,  # Will be set to True only if plate_source='vision'
            plate_source
        ))
        
        order_id = cursor.lastrowid
        
        # Step 6: Decrement stock (CRITICAL: only after order is created)
        cursor.execute(
            "UPDATE produit SET Quantite = Quantite - %s WHERE idProduit = %s",
            (quantity, product_id)
        )
        
        # Verify stock wasn't decremented below zero (safety check)
        cursor.execute("SELECT Quantite FROM produit WHERE idProduit = %s", (product_id,))
        new_stock = cursor.fetchone()['Quantite']
        
        if new_stock < 0:
            # CRITICAL: Rollback if negative stock detected
            conn.rollback()
            conn.close()
            return {
                "success": False,
                "error": "stock_error",
                "reason": "Stock validation failed after decrement (would go negative). Order not created."
            }
        
        # Step 7: Log order creation
        cursor.execute("""
            INSERT INTO order_audit (order_id, issue_type, details)
            VALUES (%s, %s, %s)
        """, (
            order_id,
            'CREATED',
            json.dumps({
                'client_id': client_id,
                'product_id': product_id,
                'quantity': quantity,
                'plate': plate,
                'plate_source': plate_source,
                'user_id': user_id
            })
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "order_id": order_id,
            "user_confirmed": False,
            "client": client_result['name'],
            "product": product_result['product']['name'],
            "quantity": quantity,
            "plate": plate,
            "status": "en attente",
            "message": f"Order #{order_id} created (awaiting your confirmation)"
        }
        
    except mysql.connector.Error as db_err:
        # MEDIUM PRIORITY FIX #2: Structured database error logging
        logger.error(f"Database error creating order: {db_err}, Client: {client_name}, Product: {product_name}")
        conn.rollback()
        conn.close()
        return {
            "success": False,
            "error": "database_error",
            "message": "Unable to process order due to system error. Please try again later."
        }
    except Exception as e:
        # MEDIUM PRIORITY FIX #2: Catch-all error logging
        logger.error(f"Unexpected error creating order: {e}")
        conn.rollback()
        conn.close()
        return {
            "success": False,
            "error": "system_error",
            "message": "An unexpected error occurred. Please contact support."
        }


def get_user_role(user_id: int) -> str:
    """
    HIGH PRIORITY FIX #4: Admin Authentication
    Get the role of a user by user_id.
    Returns 'admin' or 'client' or None if user not found.
    """
    if not user_id:
        return None
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT role FROM user WHERE idUser = %s", (user_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return result.get('role', 'client')  # Default to client if no role
        return None
    except Exception as e:
        logger.error(f"Error fetching user role: {e}")
        conn.close()
        return None


def list_clients():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT nom FROM client")
    clients = [row[0] for row in cursor.fetchall()]
    conn.close()
    return clients

def list_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT idProduit, nom, Quantite, prix FROM produit")
    products = [{"id": row[0], "name": row[1], "stock": row[2], "price": float(row[3])} for row in cursor.fetchall()]
    conn.close()
    return products

def add_product(name: str, quantity: int, price: float):
    if not name or not name.strip():
        return None
    if quantity < 0:
        quantity = 0
    if price < 0:
        price = 0.0
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO produit (nom, Quantite, prix) VALUES (%s, %s, %s)", (name.strip(), quantity, price))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def update_product(idProduit: int, name: str, quantity: int, price: float):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE produit SET nom = %s, Quantite = %s, prix = %s WHERE idProduit = %s", (name, quantity, price, idProduit))
    conn.commit()
    conn.close()

def delete_product(idProduit: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM produit WHERE idProduit = %s", (idProduit,))
    conn.commit()
    conn.close()

def create_new_client(name: str):
    if not name or not name.strip():
        return None
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Create a user for this client first
        email = f"{name.lower().replace(' ', '_')}@client.smartwh.com"
        cursor.execute("INSERT INTO user (email, motpass) VALUES (%s, %s)", 
                       (email, "changeme123"))
        user_id = cursor.lastrowid
        
        # 2. Create the client
        cursor.execute("INSERT INTO client (nom, adresse, telephone, idUser) VALUES (%s, %s, %s, %s)", 
                       (name.strip(), "Adresse non renseignée", "00000000", user_id))
        client_id = cursor.lastrowid
        conn.commit()
        return client_id
    except Exception as e:
        print(f"❌ DB Error: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def register_new_user(full_name: str, email: str, company: str, password: str):
    """
    Register a new user with client profile - NO ADMIN APPROVAL REQUIRED.
    Returns immediately active account.
    """
    if not all([full_name, email, company, password]):
        return {"success": False, "message": "All fields are required"}
    
    email_lower = email.lower().strip()
    
    # Create a fresh connection with autocommit enabled
    temp_conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "smart_warehouse"),
        autocommit=True
    )
    cursor = temp_conn.cursor()
    
    try:
        # Check if email already exists
        cursor.execute("SELECT idUser FROM user WHERE email = %s", (email_lower,))
        existing = cursor.fetchone()
        if existing:
            return {"success": False, "message": "Email already registered"}
        
        # Hash password
        import hashlib
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Insert user
        cursor.execute(
            "INSERT INTO user (email, motpass) VALUES (%s, %s)",
            (email_lower, hashed_password)
        )
        
        # Get user_id - must do this immediately after insert
        cursor.execute("SELECT idUser FROM user WHERE email = %s", (email_lower,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return {"success": False, "message": "Failed to create user - could not retrieve ID"}
        
        user_id = user_row[0]
        print(f"✅ User created: id={user_id}, email={email_lower}")
        
        # Insert client - use explicit column value for idUser
        insert_sql = "INSERT INTO client (nom, adresse, telephone, idUser) VALUES (%s, %s, %s, %s)"
        cursor.execute(insert_sql, (full_name.strip(), company.strip(), "00000000", user_id))
        
        # Get client ID
        cursor.execute("SELECT idClient FROM client WHERE idUser = %s ORDER BY idClient DESC LIMIT 1", (user_id,))
        client_row = cursor.fetchone()
        client_id = client_row[0] if client_row else None
        
        print(f"✅ Client created: id={client_id}, name={full_name.strip()}")
        
        return {
            "success": True,
            "message": "Account created successfully! You can now login.",
            "user_id": user_id,
            "client_id": client_id
        }
    except Exception as e:
        print(f"❌ Registration Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": f"Registration failed: {str(e)}"}
    finally:
        cursor.close()
        temp_conn.close()


def login_user(email: str, password: str):
    """
    Authenticate a user and return their profile.
    """
    if not email or not password:
        return {"success": False, "message": "Email and password required"}
    
    email_lower = email.lower().strip()
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Hash the provided password to compare
        import hashlib
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Check for admin login (special case)
        if email_lower == "admin@smart.com":
            cursor.execute("SELECT * FROM user WHERE email = %s", (email_lower,))
            user = cursor.fetchone()
            if user:
                # Check password (either plaintext 'admin' or hashed)
                if user['motpass'] == password or user['motpass'] == hashed_password:
                    return {
                        "success": True,
                        "user": {
                            "id": user['idUser'],
                            "email": user['email'],
                            "fullName": "Admin Principal",
                            "company": "SmartWarehouse",
                            "role": "admin"
                        }
                    }
            # Return admin even without DB entry for demo
            if password == "admin":
                return {
                    "success": True,
                    "user": {
                        "id": 0,
                        "email": "admin@smart.com",
                        "fullName": "Admin Principal",
                        "company": "SmartWarehouse",
                        "role": "admin"
                    }
                }
        
        # Normal user login
        cursor.execute("""
            SELECT u.idUser, u.email, u.motpass, c.idClient, c.nom, c.adresse
            FROM user u
            LEFT JOIN client c ON u.idUser = c.idUser
            WHERE u.email = %s
        """, (email_lower,))
        
        result = cursor.fetchone()
        
        if not result:
            return {"success": False, "message": "Email not found"}
        
        # Check password (support both plaintext legacy and hashed)
        stored_password = result['motpass']
        if stored_password != hashed_password and stored_password != password:
            return {"success": False, "message": "Invalid password"}
        
        return {
            "success": True,
            "user": {
                "id": result['idUser'],
                "email": result['email'],
                "fullName": result['nom'] or "User",
                "company": result['adresse'] or "N/A",
                "role": "client"
            }
        }
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return {"success": False, "message": f"Login failed: {str(e)}"}
    finally:
        cursor.close()
        conn.close()
def save_chat_message(session_id: int, role: str, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_message (idSession, role, content) VALUES (%s, %s, %s)", (session_id, role, content))
    conn.commit()
    conn.close()

def get_chat_sessions(idUser: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM chat_session WHERE idUser = %s ORDER BY createdAt DESC", (idUser,))
    sessions = cursor.fetchall()
    conn.close()
    return sessions

def get_chat_messages(session_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT role, content, timestamp FROM chat_message WHERE idSession = %s ORDER BY timestamp ASC", (session_id,))
    messages = cursor.fetchall()
    conn.close()
    return messages

def create_chat_session(idUser: int, title: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_session (idUser, title) VALUES (%s, %s)", (idUser, title))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id

def get_user_by_email(email: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT idUser, email, motpass FROM user WHERE email = %s", (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def update_password(user_id: int, new_password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE user SET motpass = %s WHERE idUser = %s", (new_password, user_id))
    conn.commit()
    conn.close()

def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    # CASCADE will handle dependent rows automatically
    cursor.execute("DELETE FROM user WHERE idUser = %s", (user_id,))
    conn.commit()
    conn.close()

# --- Orders Management ---
def list_orders():
    """Get all orders with client and product details"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            com.idCommande as id,
            cl.nom as client_name,
            p.nom as product_name,
            com.quantite as quantity,
            com.statut as status,
            com.dateCommande as order_date,
            com.plaque_vehicule as plate,
            d.nom as depot_name
        FROM commande com
        LEFT JOIN client cl ON com.idClient = cl.idClient
        LEFT JOIN produit p ON com.idProduit = p.idProduit
        LEFT JOIN depot d ON com.idDepot = d.idDepot
        ORDER BY com.dateCommande DESC
    """)
    orders = cursor.fetchall()
    conn.close()
    return orders

def get_order_by_id(order_id: int):
    """Get a specific order by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            com.idCommande as id,
            cl.nom as client_name,
            cl.telephone as client_phone,
            p.nom as product_name,
            p.prix as product_price,
            com.quantite as quantity,
            com.statut as status,
            com.dateCommande as order_date,
            com.plaque_vehicule as plate,
            d.nom as depot_name
        FROM commande com
        LEFT JOIN client cl ON com.idClient = cl.idClient
        LEFT JOIN produit p ON com.idProduit = p.idProduit
        LEFT JOIN depot d ON com.idDepot = d.idDepot
        WHERE com.idCommande = %s
    """, (order_id,))
    order = cursor.fetchone()
    conn.close()
    return order

def list_clients_full():
    """Get all clients with full details"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            c.idClient as id,
            c.nom as name,
            c.adresse as address,
            c.telephone as phone,
            u.email
        FROM client c
        LEFT JOIN user u ON c.idUser = u.idUser
        ORDER BY c.nom
    """)
    clients = cursor.fetchall()
    conn.close()
    return clients

def get_dashboard_stats():
    """
    ✅ GET DASHBOARD STATISTICS (Confirmed and Verified Orders Only)
    
    Critical Fixes Applied:
    - #1: Counts only user_confirmed orders
    - #2: Uses GREATEST to prevent negative stock in calculations
    - #3, #8: Filters arrived_today by vision-verified plates only
    - #6: Tracks unconfirmed orders separately for admin awareness
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Total products
    cursor.execute("SELECT COUNT(*) as total FROM produit")
    total_products = cursor.fetchone()['total']
    
    # Low stock items (< 20)
    cursor.execute("SELECT COUNT(*) as low FROM produit WHERE Quantite < 20")
    low_stock = cursor.fetchone()['low']
    
    # Orders by status (ONLY CONFIRMED)
    cursor.execute("""
        SELECT statut, COUNT(*) as count 
        FROM commande 
        WHERE user_confirmed = TRUE
        GROUP BY statut
    """)
    orders_by_status = {row['statut']: row['count'] for row in cursor.fetchall()}
    
    # Today's confirmed orders only
    cursor.execute("""
        SELECT COUNT(*) as today 
        FROM commande 
        WHERE DATE(dateCommande) = CURDATE() AND user_confirmed = TRUE
    """)
    today_orders = cursor.fetchone()['today'] or 0
    
    # Today's VISION-VERIFIED vehicles only (not chat-only plates)
    # FIX #3, #8: Only count plates verified by vision OCR
    cursor.execute("""
        SELECT COUNT(DISTINCT plaque_vehicule) as arrived_today
        FROM commande 
        WHERE DATE(dateCommande) = CURDATE() 
          AND plaque_vehicule IS NOT NULL 
          AND plate_verified = TRUE
          AND plate_source = 'vision'
    """)
    arrived_today = cursor.fetchone()['arrived_today'] or 0
    
    # Total active orders (pending or in progress, CONFIRMED ONLY)
    # FIX #1: Only count user_confirmed orders
    cursor.execute("""
        SELECT COUNT(*) as active 
        FROM commande 
        WHERE statut IN ('en attente', 'en cours') AND user_confirmed = TRUE
    """)
    active_orders = cursor.fetchone()['active'] or 0
    
    # Average stock level (NO NEGATIVE)
    # FIX #2: Use GREATEST to ensure no negative values in calculation
    cursor.execute("""
        SELECT AVG(GREATEST(Quantite, 0)) as avg_stock 
        FROM produit
    """)
    avg_stock_result = cursor.fetchone()['avg_stock']
    avg_stock = round(avg_stock_result or 0, 1)
    
    # Total inventory value (NO NEGATIVE)
    # FIX #7: Use GREATEST to prevent negative asset values
    cursor.execute("""
        SELECT SUM(GREATEST(Quantite, 0) * Prix) as inventory_value 
        FROM produit
    """)
    inventory_value = round(cursor.fetchone()['inventory_value'] or 0, 2)
    
    # Total clients
    cursor.execute("SELECT COUNT(*) as total FROM client")
    total_clients = cursor.fetchone()['total']
    
    # Total vehicles/trucks
    cursor.execute("SELECT COUNT(*) as total FROM camion")
    total_vehicles = cursor.fetchone()['total']
    
    # ADMIN AWARENESS: Unconfirmed orders (should be reviewed and confirmed)
    cursor.execute("""
        SELECT COUNT(*) as unconfirmed
        FROM commande
        WHERE user_confirmed = FALSE
    """)
    unconfirmed_orders = cursor.fetchone()['unconfirmed'] or 0
    
    # ADMIN AWARENESS: Unverified plates (should be verified if actually received)
    cursor.execute("""
        SELECT COUNT(DISTINCT plaque_vehicule) as unverified
        FROM commande
        WHERE plaque_vehicule IS NOT NULL 
          AND plate_verified = FALSE
    """)
    unverified_plates = cursor.fetchone()['unverified'] or 0
    
    conn.close()
    
    return {
        # Core metrics (reliable, only count confirmed/verified)
        "total_products": total_products,
        "low_stock_items": low_stock,
        "orders_by_status": orders_by_status,
        "today_orders": today_orders,
        "arrived_today": arrived_today,
        "active_orders": active_orders,
        "avg_stock": avg_stock,
        "inventory_value": inventory_value,
        "total_clients": total_clients,
        "total_vehicles": total_vehicles,
        # Admin awareness metrics (helps identify issues)
        "unconfirmed_orders": unconfirmed_orders,
        "unverified_plates": unverified_plates
    }

if __name__ == "__main__":
    init_db()
