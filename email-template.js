// email-template.js
// Email template for NexShip Xpress

function getEmailTemplate(trackingCode, status, recipientName, currentLocation, estimatedDelivery) {
    const baseUrl = 'http://localhost:3000'; // Change this when you deploy online
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                }
                .header {
                    background: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                    margin: -20px -20px 20px -20px;
                }
                .header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                .header p {
                    margin: 5px 0 0 0;
                    font-size: 14px;
                    opacity: 0.9;
                }
                .status {
                    display: inline-block;
                    padding: 8px 16px;
                    background: #2196F3;
                    color: white;
                    border-radius: 20px;
                    font-weight: bold;
                }
                .tracking-code {
                    font-size: 24px;
                    font-weight: bold;
                    background: #f0f0f0;
                    padding: 10px;
                    text-align: center;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📦 NexShip Xpress</h2>
                    <p>Shipment Status Update</p>
                </div>
                
                <p>Hello <strong>${recipientName || 'Valued Customer'}</strong>,</p>
                
                <p>Your shipment status has been updated to:</p>
                
                <p style="text-align: center;">
                    <span class="status">${status || 'Updated'}</span>
                </p>
                
                <div class="tracking-code">
                    Tracking Code: ${trackingCode}
                </div>
                
                ${currentLocation ? `<p><strong>📍 Current Location:</strong> ${currentLocation}</p>` : ''}
                ${estimatedDelivery ? `<p><strong>📅 Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
                
                <p style="text-align: center;">
                    <a href="${baseUrl}" class="button">🔍 Track Your Package</a>
                </p>
                
                <p>You can also visit our tracking page and enter your tracking code: <strong>${trackingCode}</strong></p>
                
                <div class="footer">
                    <p>This is an automated message from NexShip Xpress. Please do not reply to this email.</p>
                    <p>Need help? Contact us at nexshipxpress@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { getEmailTemplate };