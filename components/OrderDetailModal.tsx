import { useEffect, useState } from "react";
import Modal from "./Modal";

const getField = (data: any, key: string) => {
  if (!data) return null;
  const normalize = (s: string) => s.replace(/[\s_.]/g, '').toLowerCase();
  const target = normalize(key);

  // first try to find an exact match
  for (const k of Object.keys(data)) {
    if (normalize(k) === target) {
      const val = data[k];
      if (val !== undefined && val !== null && val !== '') return val;
    }
  }

  // then try to match by suffix to support keys like "Address.Postcode"
  for (const k of Object.keys(data)) {
    if (normalize(k).endsWith(target)) {
      const val = data[k];
      if (val !== undefined && val !== null && val !== '') return val;
    }
  }

  return null;
};

interface Props {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'scheduled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'en_route':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
      {status || 'Unknown'}
    </span>
  );
};

const InfoCard = ({ icon, title, value, subtitle }: { 
  icon: React.ReactNode; 
  title: string; 
  value: any; 
  subtitle?: string;
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 text-blue-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-lg font-semibold text-gray-900 mt-1 break-words">
          {value || 'N/A'}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

const PunctualityIndicator = ({ punctuality }: { punctuality: number | null }) => {
  if (punctuality === null) return <span className="text-gray-400">N/A</span>;
  
  const getColor = (minutes: number) => {
    if (minutes <= 5) return 'text-green-600 bg-green-50 border-green-200';
    if (minutes <= 15) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatus = (minutes: number) => {
    if (minutes <= 5) return 'Excellent';
    if (minutes <= 15) return 'Good';
    return 'Late';
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getColor(punctuality)}`}>
      {punctuality > 0 ? `+${punctuality}` : punctuality} min - {getStatus(Math.abs(punctuality))}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
      {title}
    </h3>
    {children}
  </div>
);

const DetailRow = ({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center space-x-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <div className="text-right flex-1 ml-4">
      {typeof value === 'string' && value.includes('<div') ? (
        <div 
          className="text-sm bg-gray-50 border border-gray-200 rounded p-2 max-h-20 overflow-y-auto text-left"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : typeof value === 'string' && value.includes('<a href') ? (
        <div 
          className="text-sm text-left"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <span className="text-sm text-gray-900">{value || 'N/A'}</span>
      )}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-4 text-gray-600">Loading order details...</span>
  </div>
);

const ErrorMessage = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="rounded-full bg-red-100 p-4 mb-4">
      <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <p className="text-red-600 font-medium">Failed to load order details</p>
    <p className="text-gray-500 text-sm mt-1">Please try again later</p>
  </div>
);

export default function OrderDetailModal({ orderId, open, onClose }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const value = (key: string) => getField(data, key);

  useEffect(() => {
    if (!open || !orderId) return;
    
    setLoading(true);
    setData(null);
    
    fetch(`/api/items?table=copy_of_tomorrow_trips&id=${orderId}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        setData(d.item?.data || null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orderId, open]);

  // Calculate driver punctuality
  const calculatePunctuality = (timeCompleted: string, arrivalTime: string) => {
    if (!timeCompleted || !arrivalTime) return null;
    
    try {
      // Extract time from datetime strings
      const getTimeMinutes = (dateTimeStr: string) => {
        const timeMatch = dateTimeStr.match(/(\d{2}):(\d{2})/);
        if (!timeMatch) return null;
        return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      };
      
      const completedMinutes = getTimeMinutes(timeCompleted);
      const arrivalMinutes = getTimeMinutes(arrivalTime);
      
      if (completedMinutes === null || arrivalMinutes === null) return null;
      
      return completedMinutes - arrivalMinutes;
    } catch {
      return null;
    }
  };

  // Extract first word from Summary
  const getDestination = (summary: string) => {
    if (!summary) return 'N/A';
    return summary.split(' ')[0];
  };

  // Format currency
  const formatCurrency = (amount: any) => {
    if (!amount) return 'N/A';
    return `£${parseFloat(amount).toFixed(2)}`;
  };

  if (!open) return null;

  const punctuality = data ? calculatePunctuality(value("Time_Completed"), value("Arrival_Time")) : null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-6xl w-full max-h-[95vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{value("OrderNumber") || orderId}
          </h1>
          {value("Status") && <StatusBadge status={value("Status")} />}
          {value("Order_Status") && <StatusBadge status={value("Order_Status")} />}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 bg-gray-50">
        {loading && <LoadingSpinner />}
        
        {!loading && !data && <ErrorMessage />}
        
        {!loading && data && (
          <div className="space-y-6">
            {/* Key Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 21h8a2 2 0 002-2v-5a2 2 0 00-2-2H8a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>}
                title="Order Number"
                value={value("OrderNumber")}
              />
              
              <InfoCard
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                title="Total Amount"
                value={formatCurrency(value("Total"))}
                subtitle={value("Auction") ? `Auction: ${value("Auction")}` : undefined}
              />
              
              <InfoCard
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
                title="Destination"
                value={getDestination(value("Summary"))}
              />
              
              <InfoCard
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Driver Punctuality"
                value={<PunctualityIndicator punctuality={punctuality} />}
              />
            </div>

            {/* Contact & Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <DetailRow 
                    label="Email" 
                    value={value("Email")}
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  />
                  <DetailRow 
                    label="Working Hours" 
                    value={value("Working_Hours")}
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  />
                  <DetailRow 
                    label="Driver" 
                    value={value("Driver1")}
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Schedule
                </h3>
                <div className="space-y-3">
                  <DetailRow 
                    label="Arrival Time" 
                    value={value("Arrival_Time")}
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  />
                  <DetailRow 
                    label="Time Completed" 
                    value={value("Time_Completed")}
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  />
                  <DetailRow 
                    label="Task Date" 
                    value={value("Task_Date")}
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  />
                </div>
              </div>
            </div>

            {/* Additional Sections */}
            <Section title="Order Details">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="space-y-3">
                    <DetailRow label="Order Description" value={value("Order_Description")} />
                    <DetailRow label="Payment Status" value={value("Payment_Status")} />
                    <DetailRow label="Payment Type" value={value("Payment_Type")} />
                    <DetailRow label="Track Order" value={value("Track_Order")} />
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="High Priority" value={value("High_Priority")} />
                    <DetailRow label="Total Volume" value={value("Total_Volume")} />
                    <DetailRow label="Amount Due" value={formatCurrency(value("Amount_Due"))} />
                    <DetailRow label="Payment Reference" value={value("Payment_Reference")} />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Address & Contact">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="space-y-3">
                    <DetailRow label="Address" value={value("Address")} />
                    <DetailRow label="Postcode" value={value("Postcode")} />
                    <DetailRow label="Contact Name" value={value("Contact_Name")} />
                    <DetailRow label="Company Name" value={value("Company_Name")} />
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="Phone" value={value("Phone")} />
                    <DetailRow label="Level" value={value("Level")} />
                    <DetailRow label="Load Time (mins)" value={value("Load_Time_Mins")} />
                    <DetailRow label="Open at Arrival" value={value("isOpenAtArrivalTime")} />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Task Information">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="space-y-3">
                    <DetailRow label="Task Type" value={value("Task_Type")} />
                    <DetailRow label="Predicted Time" value={value("Predicted_Time")} />
                    <DetailRow label="Added Time" value={value("Added_Time")} />
                    <DetailRow label="Notification Start" value={value("Notification_Start_Time")} />
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="Notification End" value={value("Notification_End_Time")} />
                    <DetailRow label="Notes to Driver" value={value("Notes_to_Driver")} />
                    <DetailRow label="Summary" value={value("Summary")} />
                  </div>
                </div>
              </div>
            </Section>

            {/* Notes Section */}
            {(value("Office_Notes") || value("Notes")) && (
              <Section title="Notes">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  {value("Office_Notes") && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Office Notes</h4>
                      <div 
                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: value("Office_Notes") }}
                      />
                    </div>
                  )}
                  {value("Notes") && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
                        {value("Notes")}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}