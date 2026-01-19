"""
Professional email templates for PakAi Nexus
Beautiful, responsive HTML emails for tenant notifications
"""

def get_email_template(title: str, content: str, cta_text: str = None, cta_link: str = None) -> str:
    """
    Generate a professional HTML email template
    
    Args:
        title: Email subject/heading
        content: Main email content (HTML supported)
        cta_text: Call-to-action button text (optional)
        cta_link: Call-to-action button link (optional)
    """
    cta_html = ""
    if cta_text and cta_link:
        cta_html = f'''
        <table role="presentation" style="margin: 30px auto;">
            <tr>
                <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="{cta_link}" target="_blank" style="
                        display: inline-block;
                        padding: 14px 32px;
                        font-size: 16px;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                    ">{cta_text}</a>
                </td>
            </tr>
        </table>
        '''
    
    return f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <!-- Main Container -->
                    <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                    🚀 PakAi Nexus
                                </h1>
                                <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px;">
                                    Multi-Tenant SaaS Platform
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                                    {title}
                                </h2>
                                <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                                    {content}
                                </div>
                                {cta_html}
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                                    Need help? Contact us at 
                                    <a href="mailto:pakaiverse@gmail.com" style="color: #2563eb; text-decoration: none;">pakaiverse@gmail.com</a>
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                    © 2026 PakAi Nexus. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    '''


def welcome_email(tenant_name: str, contact_email: str, trial_days: int = 7) -> dict:
    """Welcome email for new tenants"""
    content = f'''
    <p>Welcome to <strong>PakAi Nexus</strong>! 🎉</p>
    <p>Your account for <strong>{tenant_name}</strong> has been successfully created.</p>
    <p><strong>Account Details:</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Email: {contact_email}</li>
        <li>Trial Period: {trial_days} days</li>
        <li>Status: Active Trial</li>
    </ul>
    <p>Your trial gives you full access to all features. Start exploring now!</p>
    '''
    
    return {
        "subject": f"Welcome to PakAi Nexus - {tenant_name}",
        "html": get_email_template(
            title="Welcome to PakAi Nexus!",
            content=content,
            cta_text="Get Started",
            cta_link="https://your-app-url.com/login"
        )
    }


def subscription_expiring_email(tenant_name: str, days_remaining: int, expiry_date: str) -> dict:
    """Subscription expiring reminder"""
    content = f'''
    <p>This is a friendly reminder that your subscription for <strong>{tenant_name}</strong> is expiring soon.</p>
    <p><strong>Subscription Details:</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Days Remaining: <strong style="color: #dc2626;">{days_remaining} days</strong></li>
        <li>Expiry Date: {expiry_date}</li>
    </ul>
    <p>To avoid any interruption in service, please renew your subscription before it expires.</p>
    '''
    
    return {
        "subject": f"Subscription Expiring Soon - {tenant_name}",
        "html": get_email_template(
            title="Subscription Expiring Soon",
            content=content,
            cta_text="Renew Now",
            cta_link="https://your-app-url.com/billing"
        )
    }


def payment_received_email(tenant_name: str, amount: float, extension_days: int, new_expiry: str) -> dict:
    """Payment confirmation email"""
    content = f'''
    <p>Thank you! We've received your payment for <strong>{tenant_name}</strong>.</p>
    <p><strong>Payment Details:</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Amount: <strong>${amount:.2f}</strong></li>
        <li>Subscription Extended: {extension_days} days</li>
        <li>New Expiry Date: {new_expiry}</li>
    </ul>
    <p>Your subscription has been successfully extended. Thank you for your continued trust in PakAi Nexus!</p>
    '''
    
    return {
        "subject": f"Payment Received - {tenant_name}",
        "html": get_email_template(
            title="Payment Received ✓",
            content=content,
            cta_text="View Dashboard",
            cta_link="https://your-app-url.com/dashboard"
        )
    }


def subscription_suspended_email(tenant_name: str, reason: str) -> dict:
    """Subscription suspended notification"""
    content = f'''
    <p>Your subscription for <strong>{tenant_name}</strong> has been suspended.</p>
    <p><strong>Reason:</strong> {reason}</p>
    <p>To reactivate your account, please contact our support team or make a payment to extend your subscription.</p>
    <p>We're here to help you get back on track!</p>
    '''
    
    return {
        "subject": f"Subscription Suspended - {tenant_name}",
        "html": get_email_template(
            title="Subscription Suspended",
            content=content,
            cta_text="Contact Support",
            cta_link="mailto:pakaiverse@gmail.com"
        )
    }

def password_recovery_otp_email(user_name: str, otp: str) -> dict:
    """Password recovery OTP email"""
    content = f'''
    <p>Hi {user_name},</p>
    <p>We received a request to reset your password for your PakAi Nexus account. Please use the following 6-digit verification code to proceed:</p>
    <div style="
        background-color: #f3f4f6;
        padding: 24px;
        border-radius: 8px;
        text-align: center;
        margin: 30px 0;
        letter-spacing: 8px;
        font-size: 32px;
        font-weight: 700;
        color: #2563eb;
        border: 1px dashed #2563eb;
    ">
        {otp}
    </div>
    <p style="font-size: 14px; color: #6b7280;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    '''
    
    return {
        "subject": f"{otp} is your PakAi Nexus verification code",
        "html": get_email_template(
            title="Password Recovery",
            content=content
        )
    }
