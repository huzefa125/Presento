const { Resend } = require('resend');
const { validationResult } = require('express-validator');
const Logger = require('../utils/logger');
const settingsService = require('../services/settingsService');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Submit contact form
 */
exports.submitContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, subject, message, category } = req.body;
    
    // Get user info if authenticated
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || email;
    
    // Get IP address for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Prepare email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">${message}</p>
          ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : ''}
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">IP Address: ${ipAddress}</p>
        </div>
      </div>
    `;

    // Get support email from platform settings
    const platformSettings = await settingsService.getPlatformSettings();
    const supportEmail = platformSettings.supportEmail;
    const areNotificationsEnabled = await settingsService.areEmailNotificationsEnabled();
    
    // Send email to support (only if notifications are enabled)
    if (areNotificationsEnabled) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Inavora <noreply@inavora.com>',
          to: supportEmail,
          replyTo: userEmail,
          subject: `[Contact Form] ${subject}`,
          html: emailContent
        });
      } catch (emailError) {
        Logger.error('Error sending contact email', emailError);
        // Continue even if email fails
      }
    }

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Inavora <noreply@inavora.com>',
        to: userEmail,
        subject: 'We received your message - Inavora Support',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Thank you for contacting us!</h2>
            <p>Hi ${name},</p>
            <p>We've received your message and our support team will get back to you within 24-48 hours.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Your Message:</strong></p>
              <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">${message}</p>
            </div>
            <p>If you have any urgent questions, please call us at ${platformSettings.supportPhone} or email us directly at ${platformSettings.supportEmail}</p>
            <p>Best regards,<br>The ${platformSettings.siteName} Team</p>
          </div>
        `
      });
    } catch (emailError) {
      Logger.error('Error sending confirmation email', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24-48 hours.'
    });
  } catch (error) {
    Logger.error('Error in contact form submission', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
};

