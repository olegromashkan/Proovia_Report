import { useRouter } from 'next/router';

export default function WelcomeEmail() {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : 'Candidate Name';
  const date = typeof router.query.date === 'string' ? router.query.date : 'Monday, July 14, 2025';
  const time = typeof router.query.time === 'string' ? router.query.time : '7:30 AM';
  const score = typeof router.query.score === 'string' ? router.query.score : '0';
  const pdf = typeof router.query.pdf === 'string' ? router.query.pdf : '#';

  const html = `
  <style>
    body,
    table,
    td,
    a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table,
    td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    a { color: #b53133; text-decoration: none; }
    .main-wrapper { background-color: #f7f8fa; }
    .content-table { background-color: #ffffff; }
    .main-title { font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; color: #222222; }
    .main-text { font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #555555; line-height: 1.6; }
    @media screen and (max-width: 600px) {
      .content-table { width: 100% !important; }
      .hero-image { height: auto !important; width: 100% !important; }
      .padding-mobile { padding: 40px 20px !important; }
      .main-title { font-size: 26px !important; }
    }
  </style>
  <table class="main-wrapper" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="content-table" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; box-shadow: 0px 5px 25px rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden;">
          <tr>
            <td class="padding-mobile" align="center" style="padding: 50px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <img src="https://cdn.proovia.uk/pd/images/logo/logo-default.svg" alt="Proovia Logo" width="180" style="display: block; border: 0;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 class="main-title">We're so excited to have you!</h1>
                  </td>
                </tr>
                <tr><td style="height: 20px; line-height: 20px;">&nbsp;</td></tr>
                <tr>
                  <td align="center">
                    <p class="main-text">Hi ${name},</p>
                    <p class="main-text" style="margin-top: 1em;">The entire team at Proovia is thrilled to officially welcome you aboard! Your skills and fantastic energy during the interviews really stood out to us, and we know you're going to be a brilliant addition to the team.</p>
                  </td>
                </tr>
                <tr><td style="height: 30px; line-height: 30px;">&nbsp;</td></tr>
                <tr>
                  <td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 8px; padding: 25px;">
                      <tr>
                        <td align="center">
                          <p class="main-text" style="margin: 0;">As a confirmation of your excellent assessment, here is your result:</p>
                          <p class="main-text" style="margin: 10px 0; font-size: 42px; font-weight: 700; color: #b53133;">${score}<span style="font-size: 24px; color: #cccccc;">/100</span></p>
                          <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
                            <tr>
                              <td align="center" style="border-radius: 25px;" bgcolor="#b53133">
                                <a href="${pdf}" target="_blank" style="font-size: 14px; font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 25px; padding: 12px 25px; border: 1px solid #b53133; display: inline-block; font-weight: bold;">Download Full Results (PDF)</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 30px; line-height: 30px;">&nbsp;</td></tr>
                <tr>
                  <td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; border-bottom: 1px solid #eeeeee; padding: 20px 0;">
                      <tr>
                        <td align="center" style="padding: 10px;">
                          <p class="main-text" style="font-size: 18px; font-weight: 700; color: #b53133; margin: 0;">Your First Day Details</p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 15px;">
                          <p class="main-text" style="margin: 0;">We can't wait to see you at our main office:</p>
                          <p class="main-text" style="margin: 10px 0 0 0; font-size: 18px; font-weight: 700; color: #222222;">📅 ${date}</p>
                          <p class="main-text" style="margin: 5px 0 0 0; font-size: 18px; font-weight: 700; color: #222222;">⏰ at ${time}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 30px; line-height: 30px;">&nbsp;</td></tr>
                <tr>
                  <td align="center">
                    <p class="main-text">Get ready for a fantastic first day! We'll give you a tour, introduce you to the team, and get you settled in. Our dress code is casual, so please dress comfortably.</p>
                    <p class="main-text" style="margin-top: 1em;">We're looking forward to achieving great things together.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #f7f8fa; padding: 20px;">
              <p style="margin: 0; font-family: 'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #888888;">Proovia Ltd. &copy; 2025</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
