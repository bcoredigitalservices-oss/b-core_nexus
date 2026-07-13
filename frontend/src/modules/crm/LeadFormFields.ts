export interface ExtendedLeadFormValues {
  // Lead Info
  product_title: string;
  lead_owner: string;
  first_name: string; 
  middle_name: string;
  last_name: string;
  gender: string;
  lifecycle_status: string; 
  lead_potential: string; 
  recontact_interval_days: string; 
  request_type: string;
  type_of_lead: string;

  // Contact Info
  email: string;
  mobile_no: string;
  phone: string;
  whatsapp: string;
  phone_ext: string;

  // Organization
  organization_name: string; 
}