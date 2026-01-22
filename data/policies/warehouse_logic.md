# Warehouse Operational Policies (Pickup-Only)

1. **Pickup Flow:** All operations are client pickups. Clients arrive to collect pre-ordered goods.
2. **Gate Assignment:** All pickup vehicles are directed to **Gate D** or **Gate E** (pickup bays).
3. **Order Verification:** Before allowing entry, the agent must confirm the order status is `awaiting_pickup` in the database.
4. **Pickup Confirmation:** Once goods are collected and client confirms, the order status changes to `picked_up`.
5. **Safety:** No more than 3 vehicles allowed in the pickup bay simultaneously.
6. **Driver Comms:** All drivers must be greeted by the AI and informed of their Gate Number and estimated pickup time.
7. **No Active Order:** If no order with status `awaiting_pickup` is found for the vehicle plate, the vehicle must HOLD for manual verification.
