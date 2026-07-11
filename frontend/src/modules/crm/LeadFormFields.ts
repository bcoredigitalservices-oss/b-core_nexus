export interface ExtendedLeadFormValues {
  // Lead Info
  series: string;
  product_title: string;
  lead_owner: string;
  salutation: string;
  first_name: string; // Required
  middle_name: string;
  last_name: string;
  gender: string;
  lifecycle_status: string; // Maps to Status
  lead_potential: string; // Required
  recontact_interval_days: string; // Required
  request_type: string;
  type_of_lead: string;

  // Contact Info
  email: string;
  mobile_no: string;
  phone: string;
  whatsapp: string;
  phone_ext: string;

  // Organization
  organization_name: string; // Maps to company_name, Required
  annual_revenue: string;
  territory: string;
  no_of_employees: string;
  industry: string;
  fax: string;
  market_segment: string;

  // Address
  city: string;
  state_province: string;
  country: string;
}
