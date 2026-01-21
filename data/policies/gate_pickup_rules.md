# Gate Pickup Management Rules

## Vehicle Arrival & Pickup Confirmation Flow

### Status Workflow

1. **When Order is Created**: Status = `awaiting`
   - Order ready for pickup
   - Vehicle plate stored in system
   - Awaiting customer vehicle arrival

2. **When Vehicle Arrives at Gate**: Vision system detects plate
   - Chatbot looks up order by plate
   - Shows order details: customer, product, quantity
   - Asks admin to confirm pickup

3. **When Admin Confirms Pickup**: Status changes to `picked_up`
   - Order marked as completed
   - Vehicle can leave with merchandise
   - No further action needed

### Pickup Confirmation Dialog

When vehicle arrives at gate:

**Admin sees:**
```
🚗 Vehicle detected: 141 تونس 1457

ORDER DETAILS:
- Client: Ahmed
- Product: Claviers USB x 10
- Created: 2024-01-21
- Status: awaiting

ACTION: Reply "yes" or "confirm" to mark as picked up
```

**Admin replies:** "yes" / "confirm" / "oui" / "ok" / "livré"

**Result:**
```
✅ Pickup confirmed!
Order #1234 status changed to "picked_up"
Vehicle ready to depart
```

### Chatbot Integration

When detected_plate is provided + admin confirms:
- Chatbot finds order with matching plate
- Verifies order status is "awaiting"
- Changes status to "picked_up"
- Logs confirmation in audit trail

### Error Handling

**Case 1: No Order Found**
- Plate detected but no matching awaiting orders
- Message: "No awaiting orders for this plate"
- Action: Admin manually checks or creates order

**Case 2: Order Already Picked Up**
- Plate matches but status is already "picked_up"
- Message: "Order already completed"
- Action: No action needed

**Case 3: Wrong Plate**
- Admin can correct plate input
- System searches again with corrected plate

### Integration Points

- `/vehicle-arrival` - Receives detected plate from gate camera
- `/confirm-pickup` - Admin confirms pickup via REST API
- `/chatbot-order` - Admin talks to chatbot with detected_plate parameter

### Status Values

- `awaiting` - Order created, waiting for customer to pick up
- `picked_up` - Customer has picked up merchandise
- (future) `en_route` - Customer vehicle in transit
- (future) `delivered` - Merchandise delivered to final destination
