const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('shipments.db');

const columns = [
    'customer_email',
    'shipping_origin', 
    'destination_address', 
    'destination_city',
    'item_description', 
    'pickup_address', 
    'delivery_date', 
    'current_location_map',
    'shipping_fee_paid', 
    'shipping_fee_due', 
    'clearance_cost', 
    'payment_status'
];

let completed = 0;

columns.forEach(col => {
    db.run(`ALTER TABLE shipments ADD COLUMN ${col} TEXT`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`⏩ Column '${col}' already exists`);
            } else {
                console.log(`❌ Error adding ${col}:`, err.message);
            }
        } else {
            console.log(`✅ Added column: ${col}`);
        }
        completed++;
        if (completed === columns.length) {
            console.log('\n🎉 Database update complete!');
            db.close();
        }
    });
});

// Timeout fallback
setTimeout(() => {
    console.log('\n✅ Database update finished!');
    db.close();
}, 5000);