import React from 'react';
import ScoreCard from './ScoreCard';
import FirstDayDetails from './FirstDayDetails';

interface EmailTemplateProps {
  name: string;
  score: number;
  pdfUrl: string;
  date: string;
  time: string;
}

export default function EmailTemplate({ name, score, pdfUrl, date, time }: EmailTemplateProps) {
  return (
    <table className="main-wrapper" border={0} cellPadding="0" cellSpacing="0" width="100%">
      <style>{`
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
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
      `}</style>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '20px 10px' }}>
            <table
              className="content-table"
              align="center"
              border={0}
              cellPadding="0"
              cellSpacing="0"
              width="100%"
              style={{ maxWidth: '600px', boxShadow: '0px 5px 25px rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' }}
            >
              <tbody>
                <tr>
                  <td className="padding-mobile" align="center" style={{ padding: '50px 40px' }}>
                    <table border={0} cellPadding="0" cellSpacing="0" width="100%">
                      <tbody>
                        <tr>
                          <td align="center" style={{ paddingBottom: '30px' }}>
                            <img src="https://s3.eu-central-1.amazonaws.com/trengo/media/hc_logo_AIwK7FIhfy.png" alt="Proovia Logo" width="180" style={{ display: 'block', border: 0 }} />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <h1 className="main-title">We're so excited to have you!</h1>
                          </td>
                        </tr>
                        <tr><td style={{ height: '20px', lineHeight: '20px' }}>&nbsp;</td></tr>
                        <tr>
                          <td align="center">
                            <p className="main-text"><b>Hi {name},</b></p>
                            <p className="main-text" style={{ marginTop: '1em' }}>
                              The entire team at Proovia is thrilled to officially welcome you aboard! Your skills and fantastic energy during the interviews really stood out to us, and we know you're going to be a brilliant addition to the team.
                            </p>
                          </td>
                        </tr>
                        <tr><td style={{ height: '30px', lineHeight: '30px' }}>&nbsp;</td></tr>
                        <ScoreCard score={score} pdfUrl={pdfUrl} />
                        <tr><td style={{ height: '30px', lineHeight: '30px' }}>&nbsp;</td></tr>
                        <FirstDayDetails date={date} time={time} />
                        <tr><td style={{ height: '30px', lineHeight: '30px' }}>&nbsp;</td></tr>
                        <tr>
                          <td align="center">
                            <p className="main-text">
                              Get ready for a fantastic first day! We'll give you a tour, introduce you to the team, and get you settled in. Our dress code is casual, so please dress comfortably.
                            </p>
                            <p className="main-text" style={{ marginTop: '1em' }}>We're looking forward to achieving great things together.</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ backgroundColor: '#f7f8fa', padding: '20px' }}>
                    <p style={{ margin: 0, fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '12px', color: '#888888' }}>Proovia Ltd. &copy; 2025</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

