/**
 * Notification Service
 * Manages dispatching internal event logs and alerts to residents, staff, and admins.
 * Can be integrated with Email (Nodemailer), SMS (Twilio), or WebSockets (Socket.io) later.
 */

class NotificationService {
  /**
   * Log/dispatch notification when a complaint is created or updated
   * @param {Object} complaint - The complaint document
   * @param {string} eventType - e.g. 'CREATED', 'ASSIGNED', 'STATUS_UPDATED'
   * @param {Object} [details] - Additional contextual details
   */
  async notifyComplaintEvent(complaint, eventType, details = {}) {
    const payload = {
      eventType,
      complaintId: complaint._id,
      title: complaint.title,
      status: complaint.status,
      category: complaint.category,
      priority: complaint.priority,
      residentId: complaint.resident,
      assignedStaffId: complaint.assignedStaff,
      timestamp: new Date().toISOString(),
      ...details
    };

    // Log the notification for auditing
    console.log(`[NotificationService] [${eventType}] Complaint: ${complaint._id} - ${complaint.title}`);
    return payload;
  }

  /**
   * Log/dispatch notification for new society announcements
   * @param {Object} announcement - The announcement document
   */
  async notifyAnnouncement(announcement) {
    const payload = {
      eventType: 'NEW_ANNOUNCEMENT',
      announcementId: announcement._id,
      title: announcement.title,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      timestamp: new Date().toISOString()
    };

    console.log(`[NotificationService] [ANNOUNCEMENT] Broadcast to ${announcement.targetAudience}: ${announcement.title}`);
    return payload;
  }

  /**
   * Log/dispatch payment status alert
   * @param {Object} payment - The payment record
   */
  async notifyPaymentStatus(payment) {
    const payload = {
      eventType: 'PAYMENT_STATUS_UPDATE',
      paymentId: payment._id,
      residentId: payment.resident,
      amount: payment.amount,
      status: payment.status,
      billingPeriod: payment.billingPeriod,
      timestamp: new Date().toISOString()
    };

    console.log(`[NotificationService] [PAYMENT] Resident ${payment.resident}: ${payment.billingPeriod} marked as ${payment.status}`);
    return payload;
  }
}

module.exports = new NotificationService();
