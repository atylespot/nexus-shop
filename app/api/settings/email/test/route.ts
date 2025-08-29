import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Testing email configuration...');
    
    // Test email data
    const testOrderData = {
      orderId: 'TEST-001',
      orderNo: 'TEST-ORDER-001',
      customerName: 'টেস্ট গ্রাহক',
      customerPhone: '01712345678',
      customerAddress: 'টেস্ট ঠিকানা, ঢাকা',
      productName: 'টেস্ট পণ্য',
      totalAmount: 1500,
      orderType: 'website' as const,
      orderDate: new Date(),
      items: [
        {
          name: 'টেস্ট পণ্য ১',
          quantity: 2,
          price: 750
        }
      ]
    };

    // Send test email
    const success = await emailService.sendOrderNotification(testOrderData);
    
    if (success) {
      console.log('📧 Test email sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully! Check your inbox.' 
      });
    } else {
      console.log('❌ Test email failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send test email. Please check your email configuration.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Email service not configured or connection failed.' 
    }, { status: 500 });
  }
}
