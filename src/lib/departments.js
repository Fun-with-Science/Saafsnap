import { Trash2, Waves, Droplets, Syringe, BatteryWarning, BrickWall, PawPrint } from 'lucide-react'

export const DEPARTMENTS = {
  swm: {
    id: 'swm',
    name: 'Solid Waste Management',
    officer: 'Ward Conservancy Officer',
    escalation: ['Ward Conservancy Officer', 'Executive Engineer (SWM)', 'Municipal Commissioner'],
    covers: 'Roadside dumps, overflowing bins, market and household garbage, littered parks',
    color: '#10b981',
    icon: Trash2,
  },
  water: {
    id: 'water',
    name: 'Water Bodies & Pollution Control',
    officer: 'Environmental Engineer, Water Cell',
    escalation: ['Environmental Engineer, Water Cell', 'Regional Officer, Pollution Control Board', 'Member Secretary, Pollution Control Board'],
    covers: 'Garbage in or along rivers, ghats, ponds, lakes and canals',
    color: '#0ea5e9',
    icon: Waves,
  },
  drainage: {
    id: 'drainage',
    name: 'Sewerage & Drainage',
    officer: 'Assistant Engineer, Drainage',
    escalation: ['Assistant Engineer, Drainage', 'Executive Engineer (Drainage)', 'Municipal Commissioner'],
    covers: 'Clogged drains, open sewage, overflowing manholes, waterlogging from blockage',
    color: '#64748b',
    icon: Droplets,
  },
  health: {
    id: 'health',
    name: 'Bio-medical Waste Cell (Health)',
    officer: 'Health Officer, BMW Cell',
    escalation: ['Health Officer, BMW Cell', 'Chief Municipal Health Officer', 'Municipal Commissioner'],
    covers: 'Syringes, used masks, gloves, medicine strips, hospital or clinic waste',
    color: '#e11d48',
    icon: Syringe,
  },
  hazardous: {
    id: 'hazardous',
    name: 'E-waste & Hazardous Waste',
    officer: 'Hazardous Waste Inspector',
    escalation: ['Hazardous Waste Inspector', 'Regional Officer, Pollution Control Board', 'Member Secretary, Pollution Control Board'],
    covers: 'Old electronics, batteries, tube lights, paint or chemical containers, burning waste',
    color: '#f59e0b',
    icon: BatteryWarning,
  },
  construction: {
    id: 'construction',
    name: 'Building Dept. (C&D Waste)',
    officer: 'Assistant Engineer, C&D Waste',
    escalation: ['Assistant Engineer, C&D Waste', 'Executive Engineer (Building)', 'Municipal Commissioner'],
    covers: 'Construction and demolition debris, rubble, sand, broken tiles dumped in public',
    color: '#a16207',
    icon: BrickWall,
  },
  animal: {
    id: 'animal',
    name: 'Veterinary & Carcass Removal',
    officer: 'Veterinary Officer',
    escalation: ['Veterinary Officer', 'Deputy Chief Veterinary Officer', 'Municipal Commissioner'],
    covers: 'Dead animals, slaughter waste, animal dung heaps',
    color: '#7c3aed',
    icon: PawPrint,
  },
}

export const DEPT_LIST = Object.values(DEPARTMENTS)

export function wardFor(loc) {
  if (!loc) return 1
  const n = Math.abs(Math.round(loc.lat * 1000) * 31 + Math.round(loc.lng * 1000) * 17)
  return (n % 144) + 1
}

export function officerFor(deptId, ward, level = 0) {
  const d = DEPARTMENTS[deptId] || DEPARTMENTS.swm
  const title = d.escalation[Math.min(level, d.escalation.length - 1)]
  return level === 0 ? `${title}, Ward ${ward}` : title
}
