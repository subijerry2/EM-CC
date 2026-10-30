import { User } from '../types/auth';

export interface PreSeededUser extends User {
  passwordHash: string; // SHA-256 or mock hashed password
}

export const PRE_SEEDED_USERS: PreSeededUser[] = [
  {
    id: 'usr-driver-01',
    name: 'Officer Marcus Cole',
    email: 'driver@metroems.gov',
    role: 'driver',
    roleTitle: 'Paramedic Ambulance Driver',
    agency: 'Metropolitan Emergency Medical Services (MEMS)',
    badgeNumber: 'MED-4091',
    stationOrDept: 'Station 4 (North Civic District)',
    passwordHash: 'driver123'
  },
  {
    id: 'usr-dispatch-01',
    name: 'Captain Elena Rostova',
    email: 'dispatch@metroems.gov',
    role: 'dispatcher',
    roleTitle: 'Lead CAD Hospital Dispatcher',
    agency: 'Metropolitan Emergency Dispatch Command (911/CAD)',
    badgeNumber: 'CAD-1022',
    stationOrDept: 'Central 911 Communications Operations',
    passwordHash: 'dispatch123'
  },
  {
    id: 'usr-coord-01',
    name: 'Dr. Arthur Pendelton',
    email: 'coordinator@metroems.gov',
    role: 'coordinator',
    roleTitle: 'Regional EMS Response Operations Coordinator',
    agency: 'Regional Department of Emergency Services & Trauma Care',
    badgeNumber: 'EMS-DIR-08',
    stationOrDept: 'Division of Life-Safety Response Performance',
    passwordHash: 'coordinator123'
  },
  {
    id: 'usr-auth-01',
    name: 'Eng. Vikram Sethi, PE',
    email: 'signals@citytraffic.gov',
    role: 'authority',
    roleTitle: 'Principal Traffic Signal & ITS Engineer',
    agency: 'City Department of Transportation & Traffic Engineering',
    badgeNumber: 'DOT-ITS-55',
    stationOrDept: 'Bureau of Intelligent Transportation Systems & Corridors',
    passwordHash: 'traffic123'
  }
];
