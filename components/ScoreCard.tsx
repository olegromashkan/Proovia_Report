import React from 'react';

interface ScoreCardProps {
  score: number;
  pdfUrl: string;
}

export default function ScoreCard({ score, pdfUrl }: ScoreCardProps) {
  return (
    <tr>
      <td>
        <table
          align="center"
          border={0}
          cellPadding="0"
          cellSpacing="0"
          width="100%"
          style={{
            backgroundColor: '#fafafa',
            border: '1px solid #eeeeee',
            borderRadius: '8px',
            padding: '25px',
          }}
        >
          <tbody>
            <tr>
              <td align="center">
                <p className="main-text" style={{ margin: 0 }}>
                  As a confirmation of your excellent assessment, here is your
                  result:
                </p>
                <p
                  className="main-text"
                  style={{
                    margin: '10px 0',
                    fontSize: '42px',
                    fontWeight: 700,
                    color: '#b53133',
                  }}
                >
                  {score}
                  <span style={{ fontSize: '24px', color: '#cccccc' }}>/100</span>
                </p>
                <table
                  border={0}
                  cellSpacing="0"
                  cellPadding="0"
                  style={{ marginTop: '15px' }}
                >
                  <tbody>
                    <tr>
                      <td align="center" style={{ borderRadius: '25px', backgroundColor: '#b53133' }}>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '14px',
                            fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '25px',
                            padding: '12px 25px',
                            border: '1px solid #b53133',
                            display: 'inline-block',
                            fontWeight: 'bold',
                          }}
                        >
                          Download Full Results (PDF)
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}
