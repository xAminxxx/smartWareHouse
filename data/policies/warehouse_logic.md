# Warehouse Operational Policies

1. **Gate Priority:** Electronics deliveries (Gate A) always have priority over stationery.
2. **Outbound Flow:** Clients picking up orders (City Schools, RetailCorp) are always directed to **Gate D** or **Gate E** to separate them from incoming supplier deliveries.
3. **Low Stock Handling:** If a delivery contains items currently marked as "CRITICAL" or "LOW STOCK", bypass standard queue and assign next available gate immediately.
4. **Late Supplier Penalty:** Suppliers with reliability below 80% (like CleanStep) must have their cargo fully inspected at the gate before entry.
5. **Client Verification:** For Pickups (Clients), the agent must confirm if the order status is "READY" in the database before allowing entry to the loading bay.
6. **Safety:** No more than 3 trucks allowed in the loading bay simultaneously.
7. **Driver Comms:** All drivers must be greeted by the AI and informed of their Gate Number and expected unloading/loading time.
