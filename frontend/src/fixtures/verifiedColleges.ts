export interface College {
  id: string;
  name: string;
  state: string;
  district: string;
  university: string;
  code?: string;
}

export interface CourseDegree {
  id: string;
  level: string;
  degreeName: string;
  courseName: string;
}

export const VERIFIED_COLLEGES: College[] = [
  {
    id: 'rvce-bengaluru',
    name: 'RV College of Engineering (RVCE)',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    university: 'Visvesvaraya Technological University (VTU)',
    code: '1RJ',
  },
  {
    id: 'bmsce-bengaluru',
    name: 'BMS College of Engineering (BMSCE)',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    university: 'Visvesvaraya Technological University (VTU)',
    code: '1BM',
  },
  {
    id: 'msrit-bengaluru',
    name: 'Ramaiah Institute of Technology (MSRIT)',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    university: 'Visvesvaraya Technological University (VTU)',
    code: '1MS',
  },
  {
    id: 'pesu-bengaluru',
    name: 'PES University (RR Campus)',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    university: 'PES University',
    code: 'PES1',
  },
  {
    id: 'iisc-bengaluru',
    name: 'Indian Institute of Science (IISc)',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    university: 'Autonomous / Deemed',
    code: 'IISC',
  },
  {
    id: 'sjce-mysuru',
    name: 'Sri Jayachamarajendra College of Engineering (SJCE)',
    state: 'Karnataka',
    district: 'Mysuru',
    university: 'JSS Science and Technology University',
    code: '4JC',
  },
];

export const VERIFIED_DEGREES: CourseDegree[] = [
  { id: 'be-cs', level: 'UNDERGRADUATE', degreeName: 'B.E.', courseName: 'Computer Science & Engineering' },
  { id: 'be-ec', level: 'UNDERGRADUATE', degreeName: 'B.E.', courseName: 'Electronics & Communication' },
  { id: 'be-me', level: 'UNDERGRADUATE', degreeName: 'B.E.', courseName: 'Mechanical Engineering' },
  { id: 'bsc-gen', level: 'UNDERGRADUATE', degreeName: 'B.Sc.', courseName: 'General Sciences' },
  { id: 'bcom', level: 'UNDERGRADUATE', degreeName: 'B.Com.', courseName: 'Commerce' },
  { id: 'mtech-cs', level: 'POSTGRADUATE', degreeName: 'M.Tech.', courseName: 'Computer Science' },
  { id: 'msc', level: 'POSTGRADUATE', degreeName: 'M.Sc.', courseName: 'Physics / Mathematics' },
  { id: 'puc-science', level: 'CLASS_12_PUC', degreeName: 'PUC II', courseName: 'PCMB / PCMC' },
];
