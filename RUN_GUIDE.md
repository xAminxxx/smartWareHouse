# 🚀 SmartWarehouse AI - Guide de Lancement

Ce guide récapitule les commandes nécessaires pour démarrer et arrêter le projet proprement.

---

## 🛠️ 1. Préparation (Important)

Si tu as un serveur MySQL installé localement sur Ubuntu, il faut l'arrêter pour laisser la place à Docker :

```bash
sudo systemctl stop mysql
```

---

## 🏃 2. Lancement du Projet

### Étape A : Base de données (DOCKER)

Depuis la racine du projet :

```bash
docker compose up -d db phpmyadmin
```

### Étape B : Backend (FASTAPI)

Ouvre un terminal, active l'environnement et lance le serveur :

```bash
source /home/med-amin/envs/ml/bin/activate
python main.py
```

### Étape C : Frontend (NEXT.JS)

Ouvre un autre terminal et lance l'interface web :

```bash
cd frontend
npm run dev
```

---

## 🛑 3. Arrêt du Projet

### Arrêter le Backend et le Frontend

Dans chaque terminal, appuie sur **`CTRL + C`**.

### Arrêter les containers Docker

```bash
docker compose down
```

### (Optionnel) Relancer MySQL local

Si tu as besoin de ton MySQL local après avoir fini :

```bash
sudo systemctl start mysql
```

---

## 💡 Astuces en cas de problème

- **Port 3306 déjà occupé :** Vérifie bien que tu as fait `sudo systemctl stop mysql`.
- **Backend ne trouve pas les modules :** Vérifie que tu as bien activé l'environnement avec `source /home/med-amin/envs/ml/bin/activate`.
- **Vérifier l'état des containers :** `docker ps`
