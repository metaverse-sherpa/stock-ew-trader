// This is a placeholder service for sending email notifications
// In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.

interface EmailNotificationParams {
  email: string;
  subject: string;
  patterns: any[];
  favorites: string[];
}

export async function sendEmailNotifications(params: EmailNotificationParams) {
  const { email, subject, patterns, favorites } = params;

  console.log(`[EMAIL NOTIFICATION] To: ${email}`);
  console.log(`[EMAIL NOTIFICATION] Subject: ${subject}`);
  console.log(
    `[EMAIL NOTIFICATION] Content: New Wave 5 patterns detected for the following stocks:`,
  );

  // Log the patterns that would be sent
  patterns.forEach((pattern) => {
    const isFavorite = favorites.includes(pattern.symbol);
    console.log(
      `[EMAIL NOTIFICATION] - ${pattern.symbol} (${pattern.confidence}% confidence)${isFavorite ? " [FAVORITE]" : ""}`,
    );
  });

  // In a real implementation, you would send an actual email here
  // For example, using SendGrid:
  /*
  const msg = {
    to: email,
    from: 'notifications@ewstockpicker.com',
    subject: subject,
    html: generateEmailHtml(patterns, favorites),
  };
  return sgMail.send(msg);
  */

  // For now, just return a success promise
  return Promise.resolve({ success: true });
}

// Helper function to generate HTML content for the email
function generateEmailHtml(patterns: any[], favorites: string[]) {
  let html = `
    <h1>New Wave 5 Patterns Detected</h1>
    <p>Our analysis has identified the following stocks with Wave 5 patterns:</p>
    <table style="width:100%; border-collapse: collapse;">
      <tr>
        <th style="text-align:left; padding: 8px; border-bottom: 1px solid #ddd;">Symbol</th>
        <th style="text-align:left; padding: 8px; border-bottom: 1px solid #ddd;">Confidence</th>
        <th style="text-align:left; padding: 8px; border-bottom: 1px solid #ddd;">Detected</th>
      </tr>
  `;

  patterns.forEach((pattern) => {
    const isFavorite = favorites.includes(pattern.symbol);
    const date = new Date(pattern.created_at).toLocaleDateString();

    html += `
      <tr${isFavorite ? ' style="background-color: #f8f9fa;"' : ""}>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          ${pattern.symbol}${isFavorite ? " ⭐" : ""}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pattern.confidence}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
      </tr>
    `;
  });

  html += `
    </table>
    <p style="margin-top: 20px;">Visit the app to see detailed analysis and price targets.</p>
    <p><a href="https://ewstockpicker.com" style="color: #4f46e5;">Open EW Stock Picker</a></p>
  `;

  return html;
}
