import nodemailer from 'nodemailer';

export const getOTPEmailTemplate = (otp, type = 'sign-up') => {
    const action = type === 'sign-up' ? 'sign-up' : 'login';
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px 10px; }
            .content { background: #ffffff; border-radius: 12px; padding: 30px 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .logo { margin-bottom: 30px; }
            .logo-text { font-size: 24px; font-weight: bold; background: linear-gradient(to right, #52b176, #1e097e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .heading { font-size: 22px; font-weight: bold; color: #111; margin-bottom: 15px; }
            .subheading { font-size: 15px; color: #555; margin-bottom: 30px; line-height: 1.5; }
            .otp-container { background: #f3f4f6; border-radius: 12px; padding: 25px; margin-bottom: 30px; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111; margin: 0; white-space: nowrap; }
            .footer { font-size: 13px; color: #777; margin-top: 30px; line-height: 1.6; }
            .hr { border: 0; border-top: 1px solid #eee; margin: 30px 0; }
            
            @media only screen and (max-width: 480px) {
                .container { padding: 10px; }
                .content { padding: 20px 15px; }
                .heading { font-size: 20px; }
                .otp-code { font-size: 28px; letter-spacing: 2px; }
                .subheading { font-size: 14px; }
            }
        </style>
    </head>
    <body style="background-color: #f9fafb;">
        <div class="container">
            <div class="content">
                <div class="logo">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td align="center" valign="middle" style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 8px; padding: 4px;">
                                <img src="https://static-00.iconduck.com/assets.00/image-icon-2048x2048-9miv099b.png" width="20" height="20" alt="icon" style="display: block;">
                            </td>
                            <td style="padding-left: 10px;">
                                <span class="logo-text">PicVerse</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <h1 class="heading">Verify your PicVerse ${action}</h1>
                <p class="subheading">We have received a ${action} attempt with the following code. Please enter it in the browser window where you started ${action} for PicVerse.</p>
                
                <div class="otp-container">
                    <p class="otp-code">${otp}</p>
                </div>
                
                <p class="footer">If you did not attempt to ${action} but received this email, please disregard it. The code will remain active for 5 minutes.</p>
                
                <div class="hr"></div>
            </div>
        </div>
    </body>
    </html>
    `;
};

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const message = {
            from: `"PicVerse" <${process.env.NODEMAILER_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(message);
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Nodemailer Error:', error.message);
        throw new Error('Email sending failed. Please check SMTP settings.');
    }
};

export default sendEmail;
