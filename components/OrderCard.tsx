import React from 'react';

interface Props {
  data: Record<string, any>;
}

export default function OrderCard({ data }: Props) {
  const order = data['Order.OrderNumber'];
  const id = data['ID'] || data['id'];
  const status = data['Status'] || data['Order.Status'];
  const payment = data['Payment.Type'] || data['Order.Payment_Type'];
  const price = data['Order.Price'] || data['Price'];
  const auction = data['Auction'] || data['Order.Account_Name'];
  const postcode = data['Address.Postcode'] || '';
  return (
    <div className="border rounded-2xl p-4 space-y-2 bg-white dark:bg-gray-800 shadow">
      <div className="card-content">
        <div className="card-content__header flex justify-between items-center">
          <div className="card-info-wrapper">
            <div className="card-status flex items-center gap-2">
              <a
                href={`https://creatorapp.zoho.eu/dragrusu/copy-of-steeltrans-new/#Form:Order?recLinkID=${id}&viewLinkName=All_Orders_Report&zc_NextUrl=%23Report%3ACopy_of_Tomorrow_trips`}
                target="_blank"
                rel="noopener noreferrer"
                className="order-link font-semibold"
              >
                {order}
              </a>
              {auction && <div className="card-auction text-sm">{auction}</div>}
            </div>
            <div className="card-info text-sm flex gap-4">
              <div className="card-info__order-status">{status}</div>
              {payment && <div className="card-info__payment-type">{payment}</div>}
            </div>
          </div>
          {price && (
            <div className="card-payment text-sm">£{price}</div>
          )}
        </div>
        {postcode && (
          <div className="mt-2 text-sm text-gray-600">{postcode}</div>
        )}
        <div className="mt-2 flex gap-4 text-sm">
          <a
            href={`https://creatorapp.zoho.eu/dragrusu/copy-of-steeltrans-new/#Report:Copy_of_Tomorrow_trips?Order.OrderNumber=${order}`}
            target="_blank"
            rel="noopener noreferrer"
            className="body-link text-blue-600 hover:underline"
          >
            View Order
          </a>
          {id && (
            <a
              href={`https://api.proovia.co.uk/order-track/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="body-link text-blue-600 hover:underline"
            >
              Tracking link
            </a>
          )}
          <a
            href={`https://crm.proovia.uk/event-stream/order?search=${order}`}
            target="_blank"
            rel="noopener noreferrer"
            className="body-link text-blue-600 hover:underline"
          >
            Order images
          </a>
        </div>
      </div>
    </div>
  );
}
