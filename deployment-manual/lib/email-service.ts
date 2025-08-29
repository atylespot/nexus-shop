import nodemailer from 'nodemailer';

interface EmailSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  isActive: boolean;
  provider: string;
  apiKey?: string;
}

interface OrderNotificationData {
  orderId: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  totalAmount: number;
  orderType: 'website' | 'landing_page';
  orderDate: Date;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private settings: EmailSettings | null = null;

  async initialize() {
    try {
      // Get email settings from database
      const { db } = await import('@/lib/db');
      const emailSettings = await db.emailSetting.findFirst();
      
      if (!emailSettings || !emailSettings.isActive) {
        console.log('📧 Email service not configured or disabled');
        return false;
      }

      this.settings = emailSettings;

      if (emailSettings.provider === 'SENDGRID' && emailSettings.apiKey) {
        // SendGrid configuration
        this.transporter = nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: emailSettings.apiKey
          }
        });
      } else {
        // SMTP configuration
        this.transporter = nodemailer.createTransporter({
          host: emailSettings.host,
          port: emailSettings.port,
          secure: emailSettings.port === 465,
          auth: {
            user: emailSettings.user,
            pass: emailSettings.pass
          }
        });
      }

      // Test connection
      await this.transporter.verify();
      console.log('📧 Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      return false;
    }
  }

  async sendOrderNotification(orderData: OrderNotificationData) {
    try {
      if (!this.transporter || !this.settings) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.log('📧 Email service not available, skipping notification');
          return false;
        }
      }

      const subject = `🆕 নতুন অর্ডার #${orderData.orderNo}`;
      
      const htmlContent = this.generateOrderNotificationHTML(orderData);
      const textContent = this.generateOrderNotificationText(orderData);

      const mailOptions = {
        from: this.settings!.from,
        to: this.settings!.from, // Send to admin email
        subject: subject,
        html: htmlContent,
        text: textContent
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log('📧 Order notification sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send order notification:', error);
      return false;
    }
  }

  private generateOrderNotificationHTML(orderData: OrderNotificationData): string {
    const orderDate = new Date(orderData.orderDate).toLocaleString('bn-BD');
    const totalAmount = orderData.totalAmount.toLocaleString('bn-BD');
    
    let itemsHTML = '';
    if (orderData.items && orderData.items.length > 0) {
      itemsHTML = `
        <h3>🛍️ অর্ডার আইটেমসমূহ:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">পণ্যের নাম</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">পরিমাণ</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">মূল্য</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">৳${item.price.toLocaleString('bn-BD')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>নতুন অর্ডার নোটিফিকেশন</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .highlight { color: #667eea; font-weight: bold; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🆕 নতুন অর্ডার</h1>
            <p>আপনার ওয়েবসাইটে একটি নতুন অর্ডার এসেছে</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h2>📋 অর্ডার বিবরণ</h2>
              <p><strong>অর্ডার নম্বর:</strong> <span class="highlight">#${orderData.orderNo}</span></p>
              <p><strong>অর্ডার আইডি:</strong> ${orderData.orderId}</p>
              <p><strong>অর্ডারের ধরন:</strong> ${orderData.orderType === 'website' ? 'ওয়েবসাইট' : 'ল্যান্ডিং পেজ'}</p>
              <p><strong>অর্ডারের তারিখ:</strong> ${orderDate}</p>
            </div>

            <div class="order-info">
              <h2>👤 গ্রাহকের তথ্য</h2>
              <p><strong>নাম:</strong> ${orderData.customerName}</p>
              <p><strong>ফোন:</strong> ${orderData.customerPhone}</p>
              <p><strong>ঠিকানা:</strong> ${orderData.customerAddress}</p>
            </div>

            ${itemsHTML}

            <div class="order-info">
              <h2>💰 মূল্য বিবরণ</h2>
              <p><strong>মোট মূল্য:</strong> <span class="highlight">৳${totalAmount}</span></p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="http://localhost:3000/admin/orders" class="button">অর্ডার দেখুন</a>
            </div>

            <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>💡 পরবর্তী পদক্ষেপ:</strong></p>
              <ul>
                <li>অর্ডারটি যাচাই করুন</li>
                <li>স্টক চেক করুন</li>
                <li>কুরিয়ার অর্ডার তৈরি করুন</li>
                <li>গ্রাহককে কনফার্মেশন দিন</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOrderNotificationText(orderData: OrderNotificationData): string {
    const orderDate = new Date(orderData.orderDate).toLocaleString('bn-BD');
    const totalAmount = orderData.totalAmount.toLocaleString('bn-BD');
    
    let itemsText = '';
    if (orderData.items && orderData.items.length > 0) {
      itemsText = '\n\nঅর্ডার আইটেমসমূহ:\n';
      orderData.items.forEach(item => {
        itemsText += `- ${item.name} (${item.quantity}x) - ৳${item.price.toLocaleString('bn-BD')}\n`;
      });
    }

    return `
নতুন অর্ডার নোটিফিকেশন

অর্ডার বিবরণ:
- অর্ডার নম্বর: #${orderData.orderNo}
- অর্ডার আইডি: ${orderData.orderId}
- অর্ডারের ধরন: ${orderData.orderType === 'website' ? 'ওয়েবসাইট' : 'ল্যান্ডিং পেজ'}
- অর্ডারের তারিখ: ${orderDate}

গ্রাহকের তথ্য:
- নাম: ${orderData.customerName}
- ফোন: ${orderData.customerPhone}
- ঠিকানা: ${orderData.customerAddress}

${itemsText}

মূল্য বিবরণ:
- মোট মূল্য: ৳${totalAmount}

অর্ডার দেখতে এখানে ক্লিক করুন: http://localhost:3000/admin/orders

পরবর্তী পদক্ষেপ:
1. অর্ডারটি যাচাই করুন
2. স্টক চেক করুন
3. কুরিয়ার অর্ডার তৈরি করুন
4. গ্রাহককে কনফার্মেশন দিন
    `.trim();
  }
}

export const emailService = new EmailService();
