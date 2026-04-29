// Static data for donation centres
// Latitude/longitude are approximate locations in Pune, India
export const CENTRES = [
  {
    id: 'hh_pune',
    name: 'Helping Hands Pune',
    lat: 18.5204,
    lng: 73.8567,
    capacity: 50,
    address: 'Camp, Pune',
    phone: '+91-XXX-XXXX-XXX'
  },
  {
    id: 'akf_kothrud',
    name: 'AKF Food Centre',
    lat: 18.5114,
    lng: 73.8015,
    capacity: 75,
    address: 'Kothrud, Pune',
    phone: '+91-XXX-XXXX-XXX'
  },
  {
    id: 'care_aundh',
    name: 'Care & Share',
    lat: 18.5628,
    lng: 73.8096,
    capacity: 60,
    address: 'Aundh, Pune',
    phone: '+91-XXX-XXXX-XXX'
  },
  {
    id: 'ngo_viman',
    name: 'Viman NGO',
    lat: 18.4424,
    lng: 73.8108,
    capacity: 40,
    address: 'Viman Nagar, Pune',
    phone: '+91-XXX-XXXX-XXX'
  },
  {
    id: 'charity_pashan',
    name: 'Charity Pashan',
    lat: 18.5374,
    lng: 73.7931,
    capacity: 55,
    address: 'Pashan, Pune',
    phone: '+91-XXX-XXXX-XXX'
  }
];

// Default user location (Pune city centre) if geolocation fails
export const DEFAULT_USER_LOCATION = {
  lat: 18.5204,
  lng: 73.8567
};
