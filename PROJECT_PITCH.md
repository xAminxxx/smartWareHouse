# 🚛 SmartWarehouse AI : Le Pitch Final (Inbound & Outbound)

Salut l'équipe ! On simplifie tout. Le projet gère les deux flux vitaux du dépôt : **l'approvisionnement** (les produits qui arrivent) et **la distribution** (les produits qui partent).

---

## 🎯 L'Objectif

Transformer une image de caméra en une **décision logistique**. Le système reconnaît qui arrive et sait immédiatement quoi en faire.

---

## 🚀 Le Workflow : "De l'Image à la Décision"

### 1️⃣ Vision (OCR ALPR)

- **Action :** Le camion arrive devant la barrière.
- **Résultat :** Lecture de la plaque (ex: `111-888-TUN`).

### 2️⃣ Mémoire (RAG - Recherche de Contexte)

Le système cherche dans nos documents pour répondre à 3 questions clés :

1.  **C'est qui ?** (Fournisseur GlobalTech OU Client City Schools ?)
2.  **Il vient faire quoi ?** (Livrer des Laptops OU Récupérer du Papier A4 ?)
3.  **C'est quoi l'urgence ?** (Rupture de stock imminente OU Client VIP en attente ?)

### 3️⃣ Le Cerveau (AI Agent) - Deux Chemins Possibles

#### 🟢 Chemin A : Flux FOURNISSEURS (Entrée de stock)

> "C'est **GlobalTech**. Ils livrent des laptos. Notre stock est **critique**. Je les envoie au **Gate A** (Zone Haute Valeur) en priorité."

#### 🔵 Chemin B : Flux CLIENTS (Sortie de stock)

> "C'est **City Schools**. Ils viennent chercher la commande **#ORD-22**. Elle est prête au **Quai D**. Je les y dirige pour libérer l'espace rapidement."

---

## 💻 Ce qu'on voit dans la Web App

1.  **Gate Monitor :** Visualisation en temps réel de la plaque et de l'analyse IA.
2.  **Manager Intelligence :** L'IA explique son choix (ex: "Entrée prioritaire : Stock critique détecté via RAG").
3.  **Inventory Impact :** Le stock s'ajuste dynamiquement (ex: "+50 pc" ou "-100 ramettes").
4.  **Driver Instruction :** Un message automatique pour le chauffeur (SMS ou écran).

---

## 🔥 Pourquoi c'est "Smart" ?

- **Gestion de Conflits :** Si deux camions arrivent, l'IA décide lequel passe en premier selon l'urgence du stock.
- **Zéro Code pour les Règles :** Si on change un quai dans le fichier `policies.md`, l'IA l'apprend sans rien re-coder.
- **Explication Logique :** L'IA ne dit pas juste "Gate D", elle explique "Gate D car c'est une commande client prête".

---

**C'est un cerveau logistique complet, pas juste un gadget de lecture de plaques. 🚀**
