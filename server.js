require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const PORT = process.env.PORT || 3000;
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin-secure-92x';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

transporter.verify((error) => {
    if (error) console.log('❌ Email error:', error);
    else console.log('✅ Email ready!');
});

async function sendShipmentUpdateEmail(trackingCode, status, recipientName, customerEmail, currentLocation, estimatedDelivery) {
    if (!customerEmail || customerEmail === '') return false;

    const statusColors = {
        'Created': '#6366f1',
        'Picked by Courier': '#f59e0b',
        'On The Way': '#3b82f6',
        'Custom Hold': '#ef4444',
        'Delivered': '#10b981',
    };
    const statusColor = statusColors[status] || '#059669';

    const statusIcons = {
        'Created': '📦',
        'Picked by Courier': '🚚',
        'On The Way': '✈️',
        'Custom Hold': '⚠️',
        'Delivered': '✅',
    };
    const statusIcon = statusIcons[status] || '📦';

    const mailOptions = {
        from: `"NexShip Xpress" <${EMAIL_USER}>`,
        to: customerEmail,
        subject: `${statusIcon} Shipment Update — ${trackingCode} is now ${status}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Shipment Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">NEXSHIP XPRESS</p>
              <p style="margin:0;font-size:13px;color:#a7f3d0;letter-spacing:2px;text-transform:uppercase;">Global Logistics Network</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${statusColor}14;border-left:4px solid ${statusColor};border-radius:8px;padding:16px 20px;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Shipment Status</p>
                    <p style="margin:6px 0 0 0;font-size:20px;font-weight:700;color:${statusColor};">${statusIcon}&nbsp;&nbsp;${status}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 40px;">
              <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.6;">
                Dear <strong>${recipientName || 'Customer'}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
                We're reaching out to let you know that your shipment has been updated. Here's a summary of the latest information:
              </p>

              <!-- Info Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr style="background-color:#f8fafc;">
                  <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tracking Number</p>
                    <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#0f172a;letter-spacing:1px;">${trackingCode}</p>
                  </td>
                </tr>
                ${currentLocation ? `
                <tr style="background-color:#ffffff;">
                  <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Current Location</p>
                    <p style="margin:4px 0 0 0;font-size:14px;font-weight:600;color:#374151;">📍 ${currentLocation}</p>
                  </td>
                </tr>` : ''}
                ${estimatedDelivery ? `
                <tr style="background-color:#f8fafc;">
                  <td style="padding:14px 20px;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Estimated Delivery</p>
                    <p style="margin:4px 0 0 0;font-size:14px;font-weight:600;color:#374151;">🗓️ ${estimatedDelivery}</p>
                  </td>
                </tr>` : ''}
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="https://nexshipxpress.com/track.html?code=${trackingCode}"
                       style="display:inline-block;background:linear-gradient(135deg,#059669,#064e3b);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                      Track My Shipment &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                Or copy this link into your browser:<br/>
                <span style="color:#059669;">https://nexshipxpress.com/track.html?code=${trackingCode}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">
                Questions? Contact us at
                <a href="mailto:${EMAIL_USER}" style="color:#059669;text-decoration:none;">${EMAIL_USER}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} NexShip Xpress &mdash; All Rights Reserved<br/>
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        return false;
    }
}

async function sendPaymentStatusEmail(trackingCode, status, recipientName, customerEmail, amount, notes = '') {
    if (!customerEmail || customerEmail === '') return false;

    const isApproved = status === 'approved';

    const statusConfig = {
        approved: {
            icon: '✅',
            color: '#10b981',
            badgeBg: '#d1fae5',
            label: 'PAYMENT APPROVED',
            headline: 'Your payment has been confirmed!',
            message: 'Great news! Your payment has been verified and your shipment is now being actively processed. You will receive further updates as your package moves through our network.',
            subjectIcon: '✅'
        },
        rejected: {
            icon: '❌',
            color: '#ef4444',
            badgeBg: '#fee2e2',
            label: 'PAYMENT NOT VERIFIED',
            headline: 'Action required on your payment',
            message: notes || 'Unfortunately, we were unable to verify your payment. Please review your transaction details and resubmit, or contact our support team for assistance.',
            subjectIcon: '⚠️'
        }
    };

    const cfg = statusConfig[status] || statusConfig.rejected;

    const mailOptions = {
        from: `"NexShip Xpress" <${EMAIL_USER}>`,
        to: customerEmail,
        subject: `${cfg.subjectIcon} Payment ${isApproved ? 'Confirmed' : 'Action Required'} — ${trackingCode}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment ${isApproved ? 'Confirmed' : 'Update'}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">NEXSHIP XPRESS</p>
              <p style="margin:0;font-size:13px;color:#a7f3d0;letter-spacing:2px;text-transform:uppercase;">Global Logistics Network</p>
            </td>
          </tr>

          <!-- Status Icon Block -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px 0 40px;text-align:center;">
              <div style="display:inline-block;background-color:${cfg.badgeBg};border-radius:50%;width:72px;height:72px;line-height:72px;font-size:32px;text-align:center;margin-bottom:16px;">
                ${cfg.icon}
              </div>
              <p style="margin:0 0 6px 0;font-size:11px;color:${cfg.color};text-transform:uppercase;letter-spacing:2px;font-weight:700;">${cfg.label}</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">${cfg.headline}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 40px;">
              <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.6;">
                Dear <strong>${recipientName || 'Customer'}</strong>,
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#374151;line-height:1.6;">
                ${cfg.message}
              </p>

              <!-- Payment Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr style="background-color:#f8fafc;">
                  <td colspan="2" style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment Summary</p>
                  </td>
                </tr>
                <tr style="background-color:#ffffff;">
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:50%;">Tracking Number</td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${trackingCode}</td>
                </tr>
                <tr style="background-color:#f8fafc;">
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Amount</td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:15px;font-weight:800;color:#059669;text-align:right;">$${amount}</td>
                </tr>
                <tr style="background-color:#ffffff;">
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;">Status</td>
                  <td style="padding:12px 20px;text-align:right;">
                    <span style="display:inline-block;background-color:${cfg.badgeBg};color:${cfg.color};font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;text-transform:uppercase;letter-spacing:1px;">
                      ${isApproved ? 'Approved' : 'Not Verified'}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 24px 0;">
                    <a href="https://nexshipxpress.com/track.html?code=${trackingCode}"
                       style="display:inline-block;background:linear-gradient(135deg,#059669,#064e3b);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
                      Track My Shipment &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              ${!isApproved ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.5;">
                      <strong>Need help?</strong> Reply to this email or contact our support team and we'll assist you with resubmitting your payment.
                    </p>
                  </td>
                </tr>
              </table>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">
                Questions? Contact us at
                <a href="mailto:${EMAIL_USER}" style="color:#059669;text-decoration:none;">${EMAIL_USER}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} NexShip Xpress &mdash; All Rights Reserved<br/>
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Payment email sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Payment email failed:', error.message);
        return false;
    }
}

// Middleware
app.use(express.urlencoded({ extended: true, limit: '75mb' }));
app.use(express.json({ limit: '75mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// Database setup
const DB_PATH = path.join(__dirname, 'shipments.db');
const db = new sqlite3.Database(DB_PATH);

console.log('📁 SQLite DB:', DB_PATH);

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_code TEXT UNIQUE NOT NULL,
            status TEXT,
            recipient_name TEXT,
            customer_email TEXT,
            shipping_origin TEXT,
            destination_address TEXT,
            destination_city TEXT,
            weight TEXT,
            item_description TEXT,
            carrier TEXT,
            pickup_address TEXT,
            estimated_delivery TEXT,
            delivery_date TEXT,
            current_location TEXT,
            current_location_map TEXT,
            signature_required TEXT,
            last_update TEXT,
            shipping_fee_paid TEXT,
            shipping_fee_due TEXT,
            clearance_cost TEXT,
            payment_status TEXT,
            notes TEXT,
            parcel_photo TEXT,
            parcel_photos TEXT
        )
    `);

    db.run(`ALTER TABLE shipments ADD COLUMN parcel_photos TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('parcel_photos column error:', err.message);
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_code TEXT NOT NULL,
            amount REAL,
            crypto_amount REAL,
            payment_method TEXT,
            transaction_hash TEXT,
            status TEXT DEFAULT 'pending',
            proof_image TEXT,
            recipient_name TEXT,
            recipient_email TEXT,
            insurance INTEGER DEFAULT 0,
            express_processing INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            approved_at DATETIME,
            approved_by TEXT,
            rejection_reason TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS wallet_addresses (
            currency TEXT PRIMARY KEY,
            address TEXT NOT NULL,
            min_confirmations INTEGER DEFAULT 3,
            qr_image TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`ALTER TABLE wallet_addresses ADD COLUMN qr_image TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('QR column error:', err.message);
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS shipment_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipment_id INTEGER NOT NULL,
            status TEXT,
            date TEXT,
            title TEXT,
            description TEXT,
            location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shipment_id) REFERENCES shipments(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS shipment_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipment_id INTEGER UNIQUE NOT NULL,
            current_step TEXT,
            order_confirmed_date TEXT,
            order_confirmed_location TEXT,
            picked_date TEXT,
            picked_location TEXT,
            on_way_date TEXT,
            on_way_location TEXT,
            custom_hold_date TEXT,
            custom_hold_location TEXT,
            delivered_date TEXT,
            delivered_location TEXT,
            FOREIGN KEY (shipment_id) REFERENCES shipments(id)
        )
    `);

    const defaultWallets = [
        ['Bitcoin', 'bc1qtgkk7z5crem6f7gtzrhd6vrj5ahrk4ur28wxkg', 3],
        ['Ethereum', '0x0f140aea70f8b0c5401cf7853a27f26e82ca76ff', 12],
        ['Litecoin', 'ltc1q4030l8g0u6s8k9z5x6y7w8v9u0i1o2p3q4r5s6', 6],
        ['USDT', '0x74247736434db2193dcc1d6047c03a43e630beb0', 12]
    ];

    const stmt = db.prepare(
        'INSERT OR IGNORE INTO wallet_addresses (currency, address, min_confirmations) VALUES (?, ?, ?)'
    );

    defaultWallets.forEach(([currency, address, confirmations]) => {
        stmt.run([currency, address, confirmations]);
    });

    stmt.finalize();

    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['auto_approve', 'false']);
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['admin_email', 'nexshipxpress@gmail.com']);
});

// Helpers
function generateTrackingCode() {
    const prefix = 'NEX';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';

    for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}-${randomPart}`;
}

async function getUniqueTrackingCode() {
    let code = generateTrackingCode();
    let exists = await checkCodeExists(code);

    while (exists) {
        code = generateTrackingCode();
        exists = await checkCodeExists(code);
    }

    return code;
}

function checkCodeExists(code) {
    return new Promise((resolve) => {
        db.get('SELECT tracking_code FROM shipments WHERE tracking_code = ?', [code], (err, row) => {
            resolve(!!row);
        });
    });
}

function getAdminPassword() {
    const passwordFile = path.join(__dirname, '.admin-password');

    if (fs.existsSync(passwordFile)) {
        return fs.readFileSync(passwordFile, 'utf8').trim();
    }

    return 'admin123';
}

function requireAdmin(req, res, next) {
    if (req.cookies && req.cookies.admin_auth === 'true') {
        next();
    } else {
        res.redirect(ADMIN_PATH);
    }
}

async function processShipmentCreation(body, res) {
    const {
        status,
        recipient_name,
        customer_email,
        shipping_origin,
        destination_address,
        destination_city,
        weight,
        item_description,
        carrier,
        pickup_address,
        estimated_delivery,
        delivery_date,
        current_location,
        current_location_map,
        signature_required,
        last_update,
        shipping_fee_paid,
        shipping_fee_due,
        clearance_cost,
        payment_status,
        notes,
        parcel_photo_data,
        parcel_photos_data
    } = body;

    const tracking_code = await getUniqueTrackingCode();
    const finalLastUpdate = last_update || new Date().toLocaleString();
    const parcelPhoto = parcel_photo_data || null;
    const parcelPhotos = Array.isArray(parcel_photos_data) ? parcel_photos_data : (parcelPhoto ? [parcelPhoto] : []);

    db.run(
        `INSERT INTO shipments (
            tracking_code,
            status,
            recipient_name,
            customer_email,
            shipping_origin,
            destination_address,
            destination_city,
            weight,
            item_description,
            carrier,
            pickup_address,
            estimated_delivery,
            delivery_date,
            current_location,
            current_location_map,
            signature_required,
            last_update,
            shipping_fee_paid,
            shipping_fee_due,
            clearance_cost,
            payment_status,
            notes,
            parcel_photo,
            parcel_photos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tracking_code,
            status,
            recipient_name,
            customer_email,
            shipping_origin,
            destination_address,
            destination_city,
            weight,
            item_description,
            carrier,
            pickup_address,
            estimated_delivery,
            delivery_date,
            current_location,
            current_location_map,
            signature_required,
            finalLastUpdate,
            shipping_fee_paid,
            shipping_fee_due,
            clearance_cost,
            payment_status,
            notes,
            parcelPhoto,
            JSON.stringify(parcelPhotos)
        ],
        function (err) {
            if (err) {
                console.error('DB Error:', err);
                res.send(`<h3>Error: ${err.message}</h3><a href="${ADMIN_PATH}/dashboard">Go Back</a>`);
            } else {
                if (customer_email && customer_email !== '') {
                    sendShipmentUpdateEmail(
                        tracking_code,
                        status || 'Created',
                        recipient_name,
                        customer_email,
                        current_location,
                        estimated_delivery
                    );
                }

                res.redirect(`${ADMIN_PATH}/dashboard?success=1&code=${tracking_code}`);
            }
        }
    );
}

// =============================================
// CONTACT & QUOTE ROUTES (NEW)
// =============================================

// Contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Name, email, and message are required.' 
        });
    }

    // Send email notification to admin
    const mailOptions = {
        from: `"NexShip Xpress Website" <${EMAIL_USER}>`,
        to: EMAIL_USER,
        subject: `📬 New Contact: ${subject || 'No Subject'} from ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0F6E3F, #1a8a50); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
                </div>
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background: white; padding: 15px; border-left: 4px solid #0F6E3F; margin: 10px 0;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                    <p style="color: #6b7280; font-size: 12px;">Submitted on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions)
        .then(() => {
            // Also send auto-reply to the customer
            const autoReply = {
                from: `"NexShip Xpress" <${EMAIL_USER}>`,
                to: email,
                subject: '✅ Thank you for contacting NexShip Xpress',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #0F6E3F, #1a8a50); padding: 20px; border-radius: 10px 10px 0 0;">
                            <h2 style="color: white; margin: 0;">NexShip Xpress</h2>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
                            <h3>Dear ${name},</h3>
                            <p>Thank you for reaching out to NexShip Xpress! We have received your message and our team will get back to you within 24 hours.</p>
                            <p><strong>Your message summary:</strong></p>
                            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
                                <p><strong>Message:</strong> ${message.substring(0, 100)}...</p>
                            </div>
                            <p>For urgent inquiries, please contact us directly:</p>
                            <ul>
                                <li>📧 Email: ${EMAIL_USER}</li>
                                <li>📱 WhatsApp: <a href="https://wa.me/16099749715">Chat on WhatsApp</a></li>
                                <li>🕐 Hours: Mon-Sun: 9 AM - 9 PM</li>
                            </ul>
                            <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 5px;">
                                <p style="color: #0F6E3F; margin: 0;">🌍 Visit our website: <a href="https://nexshipxpress.com">nexshipxpress.com</a></p>
                            </div>
                        </div>
                    </div>
                `
            };

            return transporter.sendMail(autoReply);
        })
        .then(() => {
            res.json({ 
                success: true, 
                message: 'Message sent successfully!' 
            });
        })
        .catch((error) => {
            console.error('Email error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to send message. Please try again.' 
            });
        });
});

// Quote request form submission
app.post('/api/quote', (req, res) => {
    const { from, to, weight, serviceType, email, details } = req.body;

    // Validate required fields
    if (!from || !to || !email) {
        return res.status(400).json({ 
            success: false, 
            error: 'From location, to location, and email are required.' 
        });
    }

    // Send quote request to admin
    const mailOptions = {
        from: `"NexShip Xpress Website" <${EMAIL_USER}>`,
        to: EMAIL_USER,
        subject: `📦 New Quote Request from ${email}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0F6E3F, #1a8a50); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: white; margin: 0;">New Shipping Quote Request</h2>
                </div>
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: bold;">From:</td>
                            <td style="padding: 10px;">${from}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: bold;">To:</td>
                            <td style="padding: 10px;">${to}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: bold;">Weight:</td>
                            <td style="padding: 10px;">${weight || 'Not specified'} lbs</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: bold;">Service Type:</td>
                            <td style="padding: 10px;">${serviceType || 'Not specified'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: bold;">Email:</td>
                            <td style="padding: 10px;">${email}</td>
                        </tr>
                        ${details ? `
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">Details:</td>
                            <td style="padding: 10px;">${details}</td>
                        </tr>` : ''}
                    </table>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Requested on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions)
        .then(() => {
            // Send confirmation to customer
            const customerMail = {
                from: `"NexShip Xpress" <${EMAIL_USER}>`,
                to: email,
                subject: '📦 Your Shipping Quote Request - NexShip Xpress',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #0F6E3F, #1a8a50); padding: 20px; border-radius: 10px 10px 0 0;">
                            <h2 style="color: white; margin: 0;">Quote Request Received!</h2>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
                            <h3>Hello!</h3>
                            <p>Thank you for requesting a shipping quote from NexShip Xpress. We're working on calculating the best rates for your shipment.</p>
                            
                            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>Your request details:</strong></p>
                                <p>📦 From: <strong>${from}</strong> → To: <strong>${to}</strong></p>
                                ${weight ? `<p>⚖️ Weight: <strong>${weight} lbs</strong></p>` : ''}
                                ${serviceType ? `<p>🚚 Service: <strong>${serviceType}</strong></p>` : ''}
                            </div>
                            
                            <p>Our team will analyze your requirements and send you a detailed quote within 2-4 hours. For urgent quotes, please contact us directly:</p>
                            <p>📱 WhatsApp: <a href="https://wa.me/16099749715">Chat on WhatsApp</a></p>
                            <p>📧 Email: ${EMAIL_USER}</p>
                            
                            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                <p style="margin: 0; color: #92400e;">💡 <strong>Tip:</strong> Have your package dimensions ready for a more accurate quote!</p>
                            </div>
                        </div>
                    </div>
                `
            };

            return transporter.sendMail(customerMail);
        })
        .then(() => {
            res.json({ 
                success: true, 
                message: 'Quote request submitted successfully!' 
            });
        })
        .catch((error) => {
            console.error('Quote email error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to submit quote request.' 
            });
        });
});

// =============================================
// END CONTACT & QUOTE ROUTES
// =============================================

// Public routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/track/:code', (req, res) => {
    const code = req.params.code;

    db.get('SELECT * FROM shipments WHERE tracking_code = ?', [code], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Tracking code not found' });
        } else {
            res.json(row);
        }
    });
});

app.get('/api/track/:code/progress', (req, res) => {
    const code = req.params.code;

    db.get('SELECT id FROM shipments WHERE tracking_code = ?', [code], (err, shipment) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!shipment) return res.status(404).json({ error: 'Tracking code not found' });

        db.get('SELECT * FROM shipment_progress WHERE shipment_id = ?', [shipment.id], (err, progress) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(progress || {});
        });
    });
});

app.get('/api/track/:code/history', (req, res) => {
    const code = req.params.code;

    db.get('SELECT id FROM shipments WHERE tracking_code = ?', [code], (err, shipment) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!shipment) return res.status(404).json({ error: 'Tracking code not found' });

        db.all(
            'SELECT * FROM shipment_history WHERE shipment_id = ? ORDER BY id ASC',
            [shipment.id],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            }
        );
    });
});

app.get('/api/wallets', (req, res) => {
    db.all('SELECT currency, address, min_confirmations, qr_image FROM wallet_addresses', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const wallets = {};

            rows.forEach((row) => {
                wallets[row.currency] = {
                    address: row.address,
                    minConfirmations: row.min_confirmations,
                    qrImage: row.qr_image
                };
            });

            res.json(wallets);
        }
    });
});

app.post('/api/payment/submit', upload.single('proof_image'), (req, res) => {
    try {
        const {
            tracking_code,
            amount,
            crypto_amount,
            payment_method,
            transaction_hash,
            recipient_name,
            recipient_email,
            insurance,
            express_processing
        } = req.body;

        let proof_image = null;

        if (req.file) {
            proof_image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        } else if (req.body.proof_image_data) {
            proof_image = req.body.proof_image_data;
        }

        db.get(
            'SELECT id, status FROM payments WHERE tracking_code = ? AND status IN ("pending", "approved")',
            [tracking_code],
            (err, existing) => {
                if (err) {
                    return res.json({ success: false, error: err.message });
                }

                if (existing) {
                    return res.json({
                        success: false,
                        error: 'A payment for this shipment is already being processed'
                    });
                }

                db.run(
                    `INSERT INTO payments (
                        tracking_code,
                        amount,
                        crypto_amount,
                        payment_method,
                        transaction_hash,
                        proof_image,
                        recipient_name,
                        recipient_email,
                        insurance,
                        express_processing,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tracking_code,
                        amount,
                        crypto_amount,
                        payment_method,
                        transaction_hash,
                        proof_image,
                        recipient_name,
                        recipient_email,
                        insurance === 'true' ? 1 : 0,
                        express_processing === 'true' ? 1 : 0,
                        'pending'
                    ],
                    function (err) {
                        if (err) {
                            console.error('Payment insert error:', err);
                            return res.json({ success: false, error: err.message });
                        }

                        db.run(
                            'UPDATE shipments SET payment_status = ? WHERE tracking_code = ?',
                            ['Processing', tracking_code]
                        );

                        res.json({
                            success: true,
                            payment_id: this.lastID,
                            message: 'Payment submitted successfully. Waiting for admin approval.'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Payment submit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/payment/status/:tracking', (req, res) => {
    const tracking = req.params.tracking;

    db.get(
        'SELECT id, status, amount, payment_method, transaction_hash, created_at, approved_at, rejection_reason FROM payments WHERE tracking_code = ? ORDER BY id DESC LIMIT 1',
        [tracking],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (!row) {
                res.json({ status: 'not_found' });
            } else {
                res.json(row);
            }
        }
    );
});

// Admin routes
app.get(ADMIN_PATH, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post(`${ADMIN_PATH}/login`, (req, res) => {
    const { password } = req.body;
    const currentPassword = getAdminPassword();

    if (password === currentPassword) {
        res.cookie('admin_auth', 'true', {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000
        });

        res.redirect(`${ADMIN_PATH}/dashboard`);
    } else {
        res.redirect(`${ADMIN_PATH}?error=1`);
    }
});

app.post(`${ADMIN_PATH}/change-password`, requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const savedPassword = getAdminPassword();

    if (currentPassword !== savedPassword) {
        return res.json({ success: false, error: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.json({ success: false, error: 'Password must be at least 6 characters' });
    }

    fs.writeFileSync(path.join(__dirname, '.admin-password'), newPassword);
    res.json({ success: true });
});

app.get(`${ADMIN_PATH}/dashboard`, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/api/admin/shipments', requireAdmin, (req, res) => {
    db.all('SELECT * FROM shipments ORDER BY id DESC', (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.post(`${ADMIN_PATH}/shipments`, requireAdmin, upload.any(), async (req, res) => {
    try {
        const formData = req.body;

        let parcel_photo_data = null;
        let parcel_photos_data = [];

        if (req.files && req.files.length > 0) {
            const photoFiles = req.files.filter((f) => ['parcel_photo', 'parcel_photos', 'parcel_media'].includes(f.fieldname));

            if (photoFiles.length) {
                parcel_photos_data = photoFiles.map((photoFile) => `data:${photoFile.mimetype};base64,${photoFile.buffer.toString('base64')}`);
                parcel_photo_data = parcel_photos_data[0];
            }
        }

        const completeData = { ...formData, parcel_photo_data, parcel_photos_data };
        await processShipmentCreation(completeData, res);
    } catch (error) {
        console.error('Upload error:', error);
        res.send(`<h3>Error: ${error.message}</h3><a href="/admin/dashboard">Go Back</a>`);
    }
});

app.post(`${ADMIN_PATH}/shipments/:id/delete`, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM shipments WHERE id = ?', [id], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});

app.get('/api/admin/payments', requireAdmin, (req, res) => {
    const status = req.query.status || 'all';

    let query = 'SELECT * FROM payments';
    const params = [];

    if (status !== 'all') {
        query += ' WHERE status = ?';
        params.push(status);
    }

    query += ' ORDER BY id DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/admin/payments/:id/approve', requireAdmin, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM payments WHERE id = ?', [id], (err, payment) => {
        if (err || !payment) {
            return res.json({ success: false, error: 'Payment not found' });
        }

        const approvedAt = new Date().toISOString();

        db.run(
            'UPDATE payments SET status = ?, approved_at = ?, approved_by = ? WHERE id = ?',
            ['approved', approvedAt, 'Admin', id],
            async function (err) {
                if (err) {
                    return res.json({ success: false, error: err.message });
                }

                db.run(
                    'UPDATE shipments SET payment_status = ? WHERE tracking_code = ?',
                    ['Paid', payment.tracking_code]
                );

                if (payment.recipient_email) {
                    await sendPaymentStatusEmail(
                        payment.tracking_code,
                        'approved',
                        payment.recipient_name,
                        payment.recipient_email,
                        payment.amount
                    );
                }

                res.json({ success: true, message: 'Payment approved successfully' });
            }
        );
    });
});

app.post('/api/admin/payments/:id/reject', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    db.get('SELECT * FROM payments WHERE id = ?', [id], (err, payment) => {
        if (err || !payment) {
            return res.json({ success: false, error: 'Payment not found' });
        }

        db.run(
            'UPDATE payments SET status = ?, rejection_reason = ? WHERE id = ?',
            ['rejected', reason, id],
            async function (err) {
                if (err) {
                    return res.json({ success: false, error: err.message });
                }

                db.run(
                    'UPDATE shipments SET payment_status = ? WHERE tracking_code = ?',
                    ['Payment Failed', payment.tracking_code]
                );

                if (payment.recipient_email) {
                    await sendPaymentStatusEmail(
                        payment.tracking_code,
                        'rejected',
                        payment.recipient_name,
                        payment.recipient_email,
                        payment.amount,
                        reason
                    );
                }

                res.json({ success: true, message: 'Payment rejected' });
            }
        );
    });
});

app.get('/api/admin/wallets', requireAdmin, (req, res) => {
    db.all('SELECT currency, address, min_confirmations, qr_image FROM wallet_addresses', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const wallets = {};

            rows.forEach((row) => {
                wallets[row.currency] = {
                    address: row.address,
                    minConfirmations: row.min_confirmations,
                    qrImage: row.qr_image
                };
            });

            res.json(wallets);
        }
    });
});

app.post('/api/admin/wallets', requireAdmin, upload.any(), (req, res) => {
    const wallets = req.body;
    const files = req.files || [];

    const getQrImage = (fieldName) => {
        const file = files.find((f) => f.fieldname === fieldName);
        if (!file) return null;
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    };

    const qrMap = {
        Bitcoin: getQrImage('Bitcoin_qr'),
        Ethereum: getQrImage('Ethereum_qr'),
        Litecoin: getQrImage('Litecoin_qr'),
        USDT: getQrImage('USDT_qr')
    };

    const stmt = db.prepare(`
        UPDATE wallet_addresses
        SET address = ?,
            min_confirmations = ?,
            qr_image = COALESCE(?, qr_image),
            updated_at = CURRENT_TIMESTAMP
        WHERE currency = ?
    `);

    Object.entries(wallets).forEach(([currency, data]) => {
        if (currency.endsWith('_qr')) return;

        let parsedData = data;

        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch {
                parsedData = { address: data, minConfirmations: 3 };
            }
        }

        stmt.run([
            parsedData.address || '',
            parsedData.minConfirmations || 3,
            qrMap[currency] || null,
            currency
        ]);
    });

    stmt.finalize((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        res.json({
            success: true,
            message: 'Wallet addresses and QR codes updated'
        });
    });
});

app.get('/api/payment-routes', (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', ['payment_routes'], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row || !row.value) {
            return res.json({
                crypto: {},
                manual: {}
            });
        }

        try {
            res.json(JSON.parse(row.value));
        } catch {
            res.json({
                crypto: {},
                manual: {}
            });
        }
    });
});

app.get('/api/admin/payment-routes', requireAdmin, (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', ['payment_routes'], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row || !row.value) {
            return res.json({
                crypto: {},
                manual: {}
            });
        }

        try {
            res.json(JSON.parse(row.value));
        } catch {
            res.json({
                crypto: {},
                manual: {}
            });
        }
    });
});

app.post('/api/admin/payment-routes', requireAdmin, (req, res) => {
    const routes = req.body;

    db.run(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`,
        ['payment_routes', JSON.stringify(routes)],
        (err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });

            res.json({
                success: true,
                message: 'Payment routes saved successfully'
            });
        }
    );
});

app.get('/api/receipt/:tracking', (req, res) => {
    const tracking = req.params.tracking;

    db.get('SELECT * FROM shipments WHERE tracking_code = ?', [tracking], (err, shipment) => {
        if (err || !shipment) {
            return res.status(404).send('Shipment not found');
        }

        db.get(
            'SELECT * FROM payments WHERE tracking_code = ? ORDER BY id DESC LIMIT 1',
            [tracking],
            (err, payment) => {
                if (err || !payment) {
                    return res.status(404).send('Payment not found');
                }

                const html = `
                <html>
                <head>
                    <title>Receipt - ${tracking}</title>
                    <style>
                        body { font-family: Arial; padding: 40px; }
                        .box { max-width: 700px; margin: auto; border: 1px solid #ddd; padding: 20px; }
                        h2 { margin-bottom: 20px; }
                        .row { margin-bottom: 10px; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <h2>Payment Receipt</h2>

                        <div class="row"><span class="label">Tracking Code:</span> ${shipment.tracking_code}</div>
                        <div class="row"><span class="label">Recipient:</span> ${shipment.recipient_name}</div>
                        <div class="row"><span class="label">Amount Paid:</span> $${payment.amount}</div>
                        <div class="row"><span class="label">Method:</span> ${payment.payment_method}</div>
                        <div class="row"><span class="label">Transaction Hash:</span> ${payment.transaction_hash || 'N/A'}</div>
                        <div class="row"><span class="label">Status:</span> ${payment.status}</div>
                        <div class="row"><span class="label">Date:</span> ${payment.created_at}</div>

                        <hr>

                        <div class="row"><span class="label">From:</span> ${shipment.shipping_origin}</div>
                        <div class="row"><span class="label">To:</span> ${shipment.destination_address}</div>

                        <br><br>
                        <button onclick="window.print()">Print</button>
                    </div>
                </body>
                </html>
                `;

                res.send(html);
            }
        );
    });
});

app.get(`${ADMIN_PATH}/logout`, (req, res) => {
    res.clearCookie('admin_auth');
    res.redirect(ADMIN_PATH);
});

// Shipment history and progress
app.get('/api/admin/shipments/:id/history', requireAdmin, (req, res) => {
    const { id } = req.params;

    db.all(
        'SELECT * FROM shipment_history WHERE shipment_id = ? ORDER BY created_at DESC',
        [id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows);
            }
        }
    );
});

app.post('/api/admin/shipments/:id/history', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { history } = req.body;

    db.run('DELETE FROM shipment_history WHERE shipment_id = ?', [id], (err) => {
        if (err) {
            return res.json({ success: false, error: err.message });
        }

        const stmt = db.prepare(
            'INSERT INTO shipment_history (shipment_id, status, date, title, description, location) VALUES (?, ?, ?, ?, ?, ?)'
        );

        if (Array.isArray(history)) {
            history.forEach((entry) => {
                stmt.run([
                    id,
                    entry.status,
                    entry.date,
                    entry.title,
                    entry.description,
                    entry.location
                ]);
            });
        }

        stmt.finalize();
        res.json({ success: true });
    });
});

app.get('/api/admin/shipments/:id/progress', requireAdmin, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM shipment_progress WHERE shipment_id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(row || {});
        }
    });
});

app.post('/api/admin/shipments/:id/progress', requireAdmin, (req, res) => {
    const { id } = req.params;
    const progress = req.body;

    const stepMap = {
        order_confirmed: {
            status: 'Order Confirmed',
            title: 'Order Confirmed',
            description: 'Shipment has been created and is being processed.'
        },
        picked: {
            status: 'Picked by Courier',
            title: 'Picked by Courier',
            description: 'Shipment has been picked up by the courier.'
        },
        on_way: {
            status: 'On The Way',
            title: 'On The Way',
            description: 'Shipment is currently in transit.'
        },
        custom_hold: {
            status: 'Custom Hold',
            title: 'Custom Hold',
            description: 'Shipment is currently under customs clearance review.'
        },
        delivered: {
            status: 'Delivered',
            title: 'Delivered',
            description: 'Shipment has been delivered successfully.'
        }
    };

    db.run(
        `INSERT OR REPLACE INTO shipment_progress
        (
            shipment_id,
            current_step,
            order_confirmed_date,
            order_confirmed_location,
            picked_date,
            picked_location,
            on_way_date,
            on_way_location,
            custom_hold_date,
            custom_hold_location,
            delivered_date,
            delivered_location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            progress.current_step,
            progress.order_confirmed_date,
            progress.order_confirmed_location,
            progress.picked_date,
            progress.picked_location,
            progress.on_way_date,
            progress.on_way_location,
            progress.custom_hold_date,
            progress.custom_hold_location,
            progress.delivered_date,
            progress.delivered_location
        ],
        (err) => {
            if (err) {
                return res.json({ success: false, error: err.message });
            }

            const selectedStep = stepMap[progress.current_step];

            if (!selectedStep) {
                return res.json({ success: true });
            }

            const locationMap = {
                order_confirmed: progress.order_confirmed_location,
                picked: progress.picked_location,
                on_way: progress.on_way_location,
                custom_hold: progress.custom_hold_location,
                delivered: progress.delivered_location
            };

            const dateMap = {
                order_confirmed: progress.order_confirmed_date,
                picked: progress.picked_date,
                on_way: progress.on_way_date,
                custom_hold: progress.custom_hold_date,
                delivered: progress.delivered_date
            };

            const historyDate = dateMap[progress.current_step] || new Date().toLocaleString();
            const historyLocation = locationMap[progress.current_step] || '';

            db.get(
                'SELECT id FROM shipment_history WHERE shipment_id = ? AND status = ?',
                [id, selectedStep.status],
                (err, existing) => {
                    if (err) {
                        return res.json({ success: false, error: err.message });
                    }

                    if (existing) {
                        db.run(
                            `UPDATE shipment_history
                             SET date = ?, title = ?, description = ?, location = ?
                             WHERE id = ?`,
                            [
                                historyDate,
                                selectedStep.title,
                                selectedStep.description,
                                historyLocation,
                                existing.id
                            ],
                            (err) => {
                                if (err) return res.json({ success: false, error: err.message });
                                res.json({ success: true });
                            }
                        );
                    } else {
                        db.run(
                            `INSERT INTO shipment_history
                             (shipment_id, status, date, title, description, location)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                id,
                                selectedStep.status,
                                historyDate,
                                selectedStep.title,
                                selectedStep.description,
                                historyLocation
                            ],
                            (err) => {
                                if (err) return res.json({ success: false, error: err.message });
                                res.json({ success: true });
                            }
                        );
                    }
                }
            );
        }
    );
});

app.put('/api/admin/shipments/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const data = req.body;

    db.run(
        `UPDATE shipments SET
            status = ?,
            recipient_name = ?,
            customer_email = ?,
            shipping_origin = ?,
            destination_address = ?,
            destination_city = ?,
            current_location = ?,
            weight = ?,
            item_description = ?,
            carrier = ?,
            estimated_delivery = ?,
            delivery_date = ?,
            shipping_fee_paid = ?,
            shipping_fee_due = ?,
            clearance_cost = ?,
            payment_status = ?,
            signature_required = ?,
            notes = ?,
            last_update = ?,
            parcel_photo = ?,
            parcel_photos = ?
        WHERE id = ?`,
        [
            data.status,
            data.recipient_name,
            data.customer_email,
            data.shipping_origin,
            data.destination_address,
            data.destination_city,
            data.current_location,
            data.weight,
            data.item_description,
            data.carrier,
            data.estimated_delivery,
            data.delivery_date,
            data.shipping_fee_paid,
            data.shipping_fee_due,
            data.clearance_cost,
            data.payment_status,
            data.signature_required,
            data.notes,
            data.last_update,
            Array.isArray(data.parcel_photos) ? data.parcel_photos[0] || null : data.parcel_photo || null,
            Array.isArray(data.parcel_photos) ? JSON.stringify(data.parcel_photos) : data.parcel_photos || null,
            id
        ],
        function (err) {
            if (err) {
                return res.json({ success: false, error: err.message });
            }

            db.get('SELECT * FROM shipments WHERE id = ?', [id], (err, shipment) => {
                if (!err && shipment && shipment.customer_email) {
                    sendShipmentUpdateEmail(
                        shipment.tracking_code,
                        data.status,
                        data.recipient_name || shipment.recipient_name,
                        shipment.customer_email,
                        data.current_location || shipment.current_location,
                        data.estimated_delivery || shipment.estimated_delivery
                    );
                }
            });

            res.json({ success: true });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log('\n✅ NexShip Xpress Server Running!');
    console.log(`📦 Tracking: http://localhost:${PORT}`);
    console.log(`🔐 Admin: http://localhost:${PORT}${ADMIN_PATH}`);
    console.log('🔑 Default password: admin123');
    console.log('\n📧 Email: Configured for nexshipxpress@gmail.com');
    console.log('📸 Photo/video upload: Enabled (25MB per file)');
    console.log('💰 Payment system: Ready');
    console.log('🖼️ QR upload: Enabled');
    console.log('📬 Contact form: Ready');
    console.log('💼 Quote requests: Ready\n');
});
