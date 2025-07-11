import React from 'react';

interface FirstDayDetailsProps {
  date: string;
  time: string;
}

export default function FirstDayDetails({ date, time }: FirstDayDetailsProps) {
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
            borderTop: '1px solid #eeeeee',
            borderBottom: '1px solid #eeeeee',
            padding: '20px 0',
          }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '10px' }}>
                <p
                  className="main-text"
                  style={{ fontSize: '18px', fontWeight: 700, color: '#b53133', margin: 0 }}
                >
                  Your First Day Details
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style={{ paddingTop: '15px' }}>
                <p className="main-text" style={{ margin: 0 }}>
                  We can't wait to see you at our main office:
                </p>
                <p
                  className="main-text"
                  style={{ margin: '10px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#222222' }}
                >
                  📅 {date}
                </p>
                <p
                  className="main-text"
                  style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#222222' }}
                >
                  ⏰ at {time}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}
