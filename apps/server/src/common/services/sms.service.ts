import { Injectable, Logger } from "@nestjs/common";

export interface SendSmsOptions {
  recipientPhone: string;
  message: string;
}

@Injectable()
export class AgriSmsService {
  private readonly logger = new Logger(AgriSmsService.name);

  /**
   * Sends an SMS alert to a smallholder farmer or buyer in rural/low-connectivity areas.
   * Supports Ghana SMS Gateway integration (e.g. Arkesel, Africa's Talking, Twilio).
   */
  async sendSms(options: SendSmsOptions): Promise<boolean> {
    const { recipientPhone, message } = options;

    const apiKey = process.env.ARKESEL_API_KEY || process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID || "GDSS-AGRI";

    if (!apiKey) {
      this.logger.log(
        `[SMS DEV LOG] To: ${recipientPhone} | Sender: ${senderId} | Message: "${message}"`
      );
      return true;
    }

    try {
      this.logger.log(`Sending SMS to ${recipientPhone} via Arkesel/Gateway...`);
      // Arkesel v2 SMS endpoint format
      const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: senderId,
          message,
          recipients: [recipientPhone],
        }),
      });

      if (!response.ok) {
        this.logger.warn(`SMS Gateway returned HTTP ${response.status}`);
        return false;
      }

      this.logger.log(`SMS successfully dispatched to ${recipientPhone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${recipientPhone}:`, error);
      return false;
    }
  }

  /**
   * Helper template for notifying farmer of a new produce order
   */
  async notifyFarmerOrder(
    farmerPhone: string,
    orderNumber: string,
    produceName: string,
    quantity: number,
    unit: string
  ) {
    const message = `GDSS AgriTech: New order #${orderNumber} for ${quantity} ${unit} of ${produceName}. Please prepare harvest for pickup.`;
    return this.sendSms({ recipientPhone: farmerPhone, message });
  }

  /**
   * Helper template for notifying farmer of a price negotiation offer
   */
  async notifyFarmerNegotiation(
    farmerPhone: string,
    produceName: string,
    proposedPrice: string,
    proposedQty: number,
    unit: string
  ) {
    const message = `GDSS AgriTech: New price offer on ${produceName} - ${proposedQty} ${unit} at GHS ${proposedPrice}/unit. Check app to Accept/Counter.`;
    return this.sendSms({ recipientPhone: farmerPhone, message });
  }
}
