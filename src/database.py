import mysql.connector
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "smart_warehouse"),
        buffered=True # Fixes 'Unread result found'
    )

def init_db():
    temp_conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "")
    )
    cursor = temp_conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {os.getenv('DB_NAME', 'smart_warehouse')}")
    temp_conn.close()

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # --- SCHEMA DEFINITION ---
    cursor.execute("CREATE TABLE IF NOT EXISTS user (idUser INT PRIMARY KEY, email VARCHAR(100), motpass VARCHAR(100))")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS client (
        idClient INT PRIMARY KEY,
        nom VARCHAR(100),
        adresse TEXT,
        telephone VARCHAR(20),
        idUser INT,
        FOREIGN KEY (idUser) REFERENCES user(idUser)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS camion (
        idCamion INT PRIMARY KEY,
        type VARCHAR(50),
        plaque VARCHAR(20),
        idClient INT,
        FOREIGN KEY (idClient) REFERENCES client(idClient)
    )
    """)
    cursor.execute("CREATE TABLE IF NOT EXISTS gerant (idGerant INT PRIMARY KEY, nom VARCHAR(100))")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS depot (
        idDepot INT PRIMARY KEY,
        nom VARCHAR(100),
        adresse TEXT,
        idGerant INT,
        FOREIGN KEY (idGerant) REFERENCES gerant(idGerant)
    )
    """)
    cursor.execute("CREATE TABLE IF NOT EXISTS produit (idProduit INT PRIMARY KEY, nom VARCHAR(100), Quantite INT, prix DECIMAL(10,2))")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS commande (
        idCommande INT PRIMARY KEY,
        idClient INT,
        idProduit INT,
        idDepot INT,
        dateCommande DATE,
        statut VARCHAR(30),
        FOREIGN KEY (idClient) REFERENCES client(idClient),
        FOREIGN KEY (idProduit) REFERENCES produit(idProduit),
        FOREIGN KEY (idDepot) REFERENCES depot(idDepot)
    )
    """)

    # --- MASSIVE DATA SEEDING (FROM DUMP) ---
    
    # 1. Users
    users = [(i, f"client{i}@mail.com", "pass123") for i in range(1, 51)]
    cursor.executemany("INSERT IGNORE INTO user (idUser, email, motpass) VALUES (%s, %s, %s)", users)

    # 2. Gerants
    gerants = [(1, 'Gérard Dupont'), (2, 'Sami Trabelsi'), (3, 'Nour Gharbi'), (4, 'Ali Miled'), (5, 'Sonia Lahmar')]
    cursor.executemany("INSERT IGNORE INTO gerant (idGerant, nom) VALUES (%s, %s)", gerants)

    # 3. Depots
    depots = [
        (1, 'Dépôt Nord', 'Ariana', 1), (2, 'Dépôt Sud', 'Sfax', 2),
        (3, 'Dépôt Est', 'Sousse', 3), (4, 'Dépôt Ouest', 'Le Kef', 4), (5, 'Dépôt Central', 'Tunis', 5)
    ]
    cursor.executemany("INSERT IGNORE INTO depot (idDepot, nom, adresse, idGerant) VALUES (%s, %s, %s, %s)", depots)

    # 4. Clients (Subset for brevity, but enough to make it feel full)
    clients_data = [
        (1, 'Client Alpha', 'Rue Carthage', '20010001', 1),
        (2, 'Client Beta', 'Rue Bourguiba', '20010002', 2),
        (3, 'Client Gamma', 'Rue Monastir', '20010003', 3),
        (4, 'Client Delta', 'Rue Bizerte', '20010004', 4),
        (5, 'Client Epsilon', 'Rue El Mourouj', '20010005', 5),
        (6, 'Client Zeta', 'Rue Ariana', '20010006', 6),
        (7, 'Client Eta', 'Rue Sfax', '20010007', 7),
        (8, 'Client Theta', 'Rue Sousse', '20010008', 8),
        (15, 'Client Omicron', 'Rue Béja', '20010015', 15),
        (24, 'Client Omega', 'Rue Tataouine', '20010024', 24)
    ]
    cursor.executemany("INSERT IGNORE INTO client (idClient, nom, adresse, telephone, idUser) VALUES (%s, %s, %s, %s, %s)", clients_data)

    # 5. Camions
    camions = [
        (1, 'Camion benne', '145 تونس 4862', 1),
        (2, 'Camion plateau', '302 تونس 1598', 2),
        (3, 'Camion frigorifique', '137 تونس 7481', 3),
        (4, 'Camion citerne', '410 تونس 2649', 4),
        (7, 'Camion fourgon', '111 تونس 8801', 7)
    ]
    cursor.executemany("INSERT IGNORE INTO camion (idCamion, type, plaque, idClient) VALUES (%s, %s, %s, %s)", camions)

    # 6. Produits
    produits = [
        (1, 'Cartons A4', 500, 15.00), (2, 'Claviers USB', 120, 35.00), (3, 'Souris Optiques', 140, 25.00),
        (5, 'Toners', 80, 120.00), (6, 'Écrans LED 24 pouces', 60, 300.00), (25, 'Climatiseurs portables', 10, 1450.00)
    ]
    cursor.executemany("INSERT IGNORE INTO produit (idProduit, nom, Quantite, prix) VALUES (%s, %s, %s, %s)", produits)

    # 7. Commandes
    commandes = [
        (1, 1, 3, 1, '2025-11-10', 'terminée'),
        (2, 2, 7, 2, '2025-12-03', 'en cours'),
        (3, 3, 12, 3, '2025-10-05', 'en attente'),
        (10, 10, 25, 5, '2025-11-13', 'en cours'),
        (20, 15, 1, 5, '2025-10-23', 'terminée')
    ]
    # Note: I used idClient=15 for order 20 to match my seeded clients
    cursor.executemany("INSERT IGNORE INTO commande (idCommande, idClient, idProduit, idDepot, dateCommande, statut) VALUES (%s, %s, %s, %s, %s, %s)", commandes)

    conn.commit()
    conn.close()
    print("✨ La base de données est maintenant riche en données réelles !")

def get_complete_arrival_info(plaque: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
    SELECT com.idCommande, cam.type as camion_type, cl.nom as client_nom, cl.telephone, 
           com.statut as commande_statut, com.dateCommande,
           p.nom as produit_nom, p.Quantite as stock_disponible,
           d.nom as depot_nom
    FROM camion cam
    JOIN client cl ON cam.idClient = cl.idClient
    LEFT JOIN commande com ON cl.idClient = com.idClient
    LEFT JOIN produit p ON com.idProduit = p.idProduit
    LEFT JOIN depot d ON com.idDepot = d.idDepot
    WHERE cam.plaque = %s OR cam.plaque LIKE %s
    LIMIT 1
    """
    cursor.execute(query, (plaque, f"%{plaque}%"))
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

def create_new_order(client_name: str, product_name: str, quantity: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Find Client ID
    cursor.execute("SELECT idClient FROM client WHERE nom LIKE %s", (f"%{client_name}%",))
    client = cursor.fetchone()
    if not client: return None
    
    # 2. Find Product ID
    cursor.execute("SELECT idProduit FROM produit WHERE nom LIKE %s", (f"%{product_name}%",))
    product = cursor.fetchone()
    if not product: return None
    
    # 3. Create Order
    new_id = int(datetime.datetime.now().timestamp()) # Simple unique ID for demo
    cursor.execute("""
        INSERT INTO commande (idCommande, idClient, idProduit, idDepot, dateCommande, statut)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (new_id, client[0], product[0], 5, datetime.date.today(), 'en attente'))
    
    conn.commit()
    conn.close()
    return new_id

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
    cursor.execute("SELECT nom, Quantite, prix FROM produit")
    products = [{"name": row[0], "stock": row[1], "price": float(row[2])} for row in cursor.fetchall()]
    conn.close()
    return products

def create_new_client(name: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Create a dummy user for this client first
        new_id = int(datetime.datetime.now().timestamp()) % 100000 
        cursor.execute("INSERT INTO user (idUser, email, motpass) VALUES (%s, %s, %s)", 
                       (new_id, f"{name.lower().replace(' ', '')}@mail.com", "pass123"))
        
        # 2. Create the client
        cursor.execute("INSERT INTO client (idClient, nom, adresse, telephone, idUser) VALUES (%s, %s, %s, %s, %s)", 
                       (new_id, name, "Nouvel Entrepôt", "00000000", new_id))
        conn.commit()
        return new_id
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return None
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
