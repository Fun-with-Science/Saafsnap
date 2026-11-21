import { hashPassword, newId } from './auth'
import { DEPARTMENTS, wardFor, officerFor } from './departments'
import { sceneArt } from './sceneArt'

// Demo logins are listed in README.md and created in Supabase by supabase/setup.sql.
export const DEMO_PASSWORD = 'demo1234'
export const ADMIN_PASSWORD = 'admin1234'

export const USERS = [
  { key: 'admin', name: 'SaafSnap Admin', email: 'admin@saafsnap.demo', role: 'admin', password: ADMIN_PASSWORD },
  { key: 'g_swm', name: 'R. Banerjee', email: 'swm@saafsnap.demo', role: 'govt', org: { name: 'Solid Waste Management Dept.', department: 'swm', regId: 'EMP-SWM-0412', city: 'Kolkata' } },
  { key: 'g_water', name: 'S. Ghosh', email: 'water@saafsnap.demo', role: 'govt', org: { name: 'Water Bodies & Pollution Control', department: 'water', regId: 'EMP-WTR-0198', city: 'Kolkata' } },
  { key: 'g_drain', name: 'A. Mondal', email: 'drainage@saafsnap.demo', role: 'govt', org: { name: 'Sewerage & Drainage Dept.', department: 'drainage', regId: 'EMP-DRN-0077', city: 'Kolkata' } },
  { key: 'g_health', name: 'P. Sen', email: 'health@saafsnap.demo', role: 'govt', status: 'pending', org: { name: 'Bio-medical Waste Cell', department: 'health', regId: 'EMP-HLT-0331', city: 'Kolkata' } },
  { key: 'n_ganga', name: 'Green Ganga Collective', email: 'greenganga@saafsnap.demo', role: 'ngo', org: { name: 'Green Ganga Collective', regId: 'NGO/WB/2019/0231', city: 'Kolkata', color: '#0ea5e9', icon: 'waves' } },
  { key: 'n_pals', name: 'Plastic-Free Pals', email: 'pals@saafsnap.demo', role: 'ngo', org: { name: 'Plastic-Free Pals', regId: 'NGO/WB/2021/0877', city: 'Kolkata', color: '#8b5cf6', icon: 'recycle' } },
  { key: 'n_streets', name: 'Clean Streets Kolkata', email: 'streets@saafsnap.demo', role: 'ngo', org: { name: 'Clean Streets Kolkata', regId: 'NGO/WB/2020/0540', city: 'Kolkata', color: '#f59e0b', icon: 'sparkles' } },
  { key: 'n_rakshak', name: 'River Rakshak Trust', email: 'rakshak@saafsnap.demo', role: 'ngo', status: 'pending', org: { name: 'River Rakshak Trust', regId: 'NGO/WB/2024/1120', city: 'Kolkata', color: '#14b8a6', icon: 'droplets' } },
  { key: 'grp_eco', name: 'Campus Eco Club', email: 'ecoclub@saafsnap.demo', role: 'group', org: { name: 'Campus Eco Club', regId: 'CLUB-2023-14', city: 'Kolkata', color: '#f43f5e', icon: 'users' } },
  { key: 'c_ananya', name: 'Ananya Roy', email: 'citizen@saafsnap.demo', role: 'citizen' },
  { key: 'c_rahul', name: 'Rahul Das', email: 'rahul@saafsnap.demo', role: 'citizen' },
  { key: 'c_imran', name: 'Imran Sheikh', email: 'imran@saafsnap.demo', role: 'citizen' },
  { key: 'c_priya', name: 'Priya Nair', email: 'priya@saafsnap.demo', role: 'citizen' },
]

const R = [
  { kind: 'river', loc: [22.5662, 88.3418], landmark: 'Babughat, Hooghly riverbank', cat: 'water', sev: 8, days: 9, extra: 23, by: 'c_ananya', seen: ['c_rahul', 'c_imran', 'c_priya'],
    title: 'Plastic and puja waste choking the ghat', waste: ['Plastic bags', 'Flower offerings', 'Thermocol plates', 'PET bottles'], hazards: ['Water contamination', 'Harm to aquatic life'], env: 'river', vol: 'Large (truck load)', urg: 72 },
  { kind: 'market', loc: [22.5672, 88.3707], landmark: 'Sealdah market back lane', cat: 'swm', sev: 7, days: 3, extra: 14, by: 'c_rahul', seen: ['c_ananya', 'c_priya'], status: 'in_progress',
    title: 'Rotting market waste blocking the lane', waste: ['Vegetable waste', 'Plastic sacks', 'Cardboard'], hazards: ['Foul smell', 'Disease-carrying flies'], env: 'market', vol: 'Large (truck load)', urg: 24 },
  { kind: 'pond', loc: [22.5118, 88.3633], landmark: 'Rabindra Sarobar, south bank', cat: 'water', sev: 6, days: 6, extra: 5, by: 'c_priya', seen: ['c_ananya'], cleanBy: 'n_ganga', cleanDays: 1,
    title: 'Bottles and thermocol floating near the bank', waste: ['PET bottles', 'Thermocol', 'Chip packets'], hazards: ['Harm to birds and fish'], env: 'pond', vol: 'Medium (handcart load)', urg: 72 },
  { kind: 'drain', loc: [22.5651, 88.3925], landmark: 'Beleghata canal, near CIT Road', cat: 'drainage', sev: 9, days: 12, extra: 31, by: 'c_imran', seen: ['c_ananya', 'c_rahul', 'c_priya'],
    title: 'Canal completely choked with garbage', waste: ['Plastic bags', 'Household waste', 'Sewage sludge'], hazards: ['Flooding risk', 'Mosquito breeding', 'Dengue risk'], env: 'drain', vol: 'Massive (multiple trucks)', urg: 48 },
  { kind: 'road', loc: [22.5186, 88.3663], landmark: 'Gariahat road divider', cat: 'construction', sev: 5, days: 2, extra: 4, by: 'c_priya', seen: [],
    title: 'Construction rubble dumped on divider', waste: ['Broken bricks', 'Cement bags', 'Tiles'], hazards: ['Road accident risk'], env: 'road', vol: 'Medium (handcart load)', urg: 96 },
  { kind: 'road', loc: [22.5765, 88.4335], landmark: 'Salt Lake Sector V footpath', cat: 'hazardous', sev: 7, days: 4, extra: 6, by: 'c_rahul', seen: ['c_imran'],
    title: 'Old monitors and batteries on footpath', waste: ['CRT monitors', 'Batteries', 'Cables'], hazards: ['Lead and acid leakage', 'Soil contamination'], env: 'road', vol: 'Medium (handcart load)', urg: 48 },
  { kind: 'road', loc: [22.5641, 88.3512], landmark: 'Esplanade bus stand', cat: 'swm', sev: 6, days: 5, extra: 9, by: 'c_ananya', seen: ['c_rahul'], cleanBy: 'g_swm', cleanDays: 4.5,
    title: 'Overflowing bins at the bus stand', waste: ['Food wrappers', 'Paper cups', 'Plastic bags'], hazards: ['Stray animals', 'Foul smell'], env: 'road', vol: 'Medium (handcart load)', urg: 24 },
  { kind: 'river', loc: [22.4985, 88.3468], landmark: 'Adi Ganga, Tollygunge', cat: 'water', sev: 9, days: 20, extra: 40, by: 'c_imran', seen: ['c_ananya', 'c_rahul', 'c_priya'],
    title: 'Sewage and garbage turning Adi Ganga black', waste: ['Household waste', 'Plastic', 'Sewage'], hazards: ['Severe water pollution', 'Health risk for residents'], env: 'river', vol: 'Massive (multiple trucks)', urg: 72 },
  { kind: 'road', loc: [22.5395, 88.3700], landmark: 'Park Circus 7-point crossing', cat: 'swm', sev: 6, days: 7, extra: 7, by: 'c_priya', seen: ['c_imran'], cleanBy: 'n_streets', cleanDays: 2,
    title: 'Household garbage pile at the crossing', waste: ['Kitchen waste', 'Plastic bags', 'Diapers'], hazards: ['Foul smell', 'Stray dogs'], env: 'road', vol: 'Large (truck load)', urg: 24 },
  { kind: 'road', loc: [22.5205, 88.3442], landmark: 'Near Kalighat clinic lane', cat: 'health', sev: 9, days: 1, extra: 3, by: 'c_ananya', seen: [],
    title: 'Used syringes and masks dumped in lane', waste: ['Syringes', 'Used masks', 'Gloves', 'Medicine strips'], hazards: ['Needle-stick injury', 'Infection risk'], env: 'road', vol: 'Small (a few bags)', urg: 12 },
  { kind: 'pond', loc: [22.6235, 88.4204], landmark: 'Dum Dum para pond', cat: 'water', sev: 6, days: 10, extra: 6, by: 'c_rahul', seen: ['c_imran'], cleanBy: 'n_pals', cleanDays: 6,
    title: 'Plastic waste floating in the para pond', waste: ['Plastic bags', 'Bottles'], hazards: ['Fish deaths'], env: 'pond', vol: 'Medium (handcart load)', urg: 72 },
  { kind: 'drain', loc: [22.4925, 88.3121], landmark: 'Behala Chowrasta drain', cat: 'drainage', sev: 7, days: 8, extra: 8, by: 'c_priya', seen: [], cleanBy: 'g_drain', cleanDays: 3,
    title: 'Clogged drain overflowing onto the road', waste: ['Plastic', 'Silt', 'Food waste'], hazards: ['Waterlogging', 'Mosquito breeding'], env: 'drain', vol: 'Large (truck load)', urg: 48 },
  { kind: 'park', loc: [22.5806, 88.4620], landmark: 'New Town Eco Park gate', cat: 'swm', sev: 4, days: 4, extra: 2, by: 'c_imran', seen: [], cleanBy: 'grp_eco', cleanDays: 3,
    title: 'Picnic litter left on the lawn', waste: ['Food boxes', 'Plastic cutlery', 'Cans'], hazards: ['Litter spreading'], env: 'park', vol: 'Small (a few bags)', urg: 72 },
  { kind: 'road', loc: [22.6005, 88.3726], landmark: 'Shyambazar 5-point crossing', cat: 'animal', sev: 8, days: 0.3, extra: 2, by: 'c_rahul', seen: [],
    title: 'Dead animal lying on the roadside', waste: ['Animal carcass'], hazards: ['Infection risk', 'Foul smell'], env: 'road', vol: 'Small (a few bags)', urg: 12 },
  { kind: 'road', loc: [22.5851, 88.3468], landmark: 'Howrah Bridge approach', cat: 'swm', sev: 5, days: 3, extra: 3, by: 'c_priya', seen: [], cleanBy: 'c_rahul', cleanDays: 1,
    title: 'Litter heap near the bridge approach', waste: ['Paper', 'Plastic bags', 'Cups'], hazards: ['Litter spreading'], env: 'road', vol: 'Small (a few bags)', urg: 48 },
  { kind: 'drain', loc: [22.5892, 88.3910], landmark: 'Ultadanga canal bank', cat: 'water', sev: 7, days: 14, extra: 10, by: 'c_ananya', seen: ['c_priya'], cleanBy: 'n_ganga', cleanDays: 9,
    title: 'Garbage dumped along the canal bank', waste: ['Household waste', 'Plastic'], hazards: ['Water pollution'], env: 'drain', vol: 'Large (truck load)', urg: 72 },
  { kind: 'pond', loc: [22.5869, 88.4105], landmark: 'Salt Lake CK block pond', cat: 'water', sev: 5, days: 11, extra: 4, by: 'c_imran', seen: [], cleanBy: 'n_ganga', cleanDays: 7,
    title: 'Plastic ring around the CK block pond', waste: ['Plastic bags', 'Bottles'], hazards: ['Harm to aquatic life'], env: 'pond', vol: 'Medium (handcart load)', urg: 72 },
  { kind: 'market', loc: [22.5690, 88.3600], landmark: 'Bowbazar lane', cat: 'swm', sev: 6, days: 6, extra: 5, by: 'c_rahul', seen: [], cleanBy: 'n_pals', cleanDays: 4,
    title: 'Plastic heap behind shops', waste: ['Plastic sacks', 'Packaging'], hazards: ['Fire risk'], env: 'market', vol: 'Medium (handcart load)', urg: 48 },
  { kind: 'road', loc: [22.5965, 88.3713], landmark: 'Hatibagan market corner', cat: 'swm', sev: 6, days: 5, extra: 6, by: 'c_ananya', seen: [], cleanBy: 'n_streets', cleanDays: 2.5,
    title: 'Mixed waste dumped at the corner', waste: ['Food waste', 'Plastic', 'Cloth'], hazards: ['Stray animals'], env: 'road', vol: 'Medium (handcart load)', urg: 24 },
]

function complaintText(dept, ward, d) {
  return `To the ${officerFor(dept.id, ward)}, ${dept.name}:\n\nCitizens have reported "${d.title.toLowerCase()}" at ${d.landmark}. AI assessment: severity ${d.sev}/10, ${d.vol.toLowerCase()}, risks: ${d.hazards.join(', ').toLowerCase()}. Kindly arrange removal within ${d.urg} hours and upload proof of cleanup on SaafSnap.\n\nThank you.`
}

export function buildSeed() {
  const now = Date.now()
  const ids = {}
  const users = USERS.map((u, i) => {
    const id = newId('u_')
    ids[u.key] = id
    const salt = newId()
    return {
      id,
      name: u.name,
      email: u.email,
      salt,
      passwordHash: hashPassword(u.password || DEMO_PASSWORD, salt),
      role: u.role,
      status: u.status || 'active',
      org: u.org || null,
      createdAt: now - (40 - i) * 864e5,
    }
  })
  return { users, reports: buildSeedReports(ids) }
}

// ids maps each demo user key (e.g. "c_ananya") to that account's real id.
export function buildSeedReports(ids) {
  const now = Date.now()
  return R.map((d, i) => {
    const createdAt = now - d.days * 864e5
    const location = { lat: d.loc[0], lng: d.loc[1] }
    const dept = DEPARTMENTS[d.cat]
    const ward = wardFor(location)
    const reporter = USERS.find((u) => u.key === d.by)
    const timeline = [
      { type: 'reported', at: createdAt, by: ids[d.by], text: `Reported by ${reporter.name}` },
      { type: 'ai', at: createdAt + 4000, text: `AI tagged it as ${dept.name.toLowerCase()} · severity ${d.sev}/10` },
      { type: 'sent', at: createdAt + 6000, text: `Complaint sent to ${officerFor(d.cat, ward)}` },
    ]
    let status = d.status || 'assigned'
    let cleanup = null
    if (d.status === 'in_progress') {
      timeline.push({ type: 'progress', at: createdAt + 0.6 * 864e5, text: 'Department acknowledged and started work' })
    }
    if (d.cleanBy) {
      status = 'cleaned'
      const at = createdAt + d.cleanDays * 864e5
      const cleaner = USERS.find((u) => u.key === d.cleanBy)
      cleanup = {
        by: ids[d.cleanBy],
        at,
        photo: sceneArt(d.kind, false, i + 1),
        verification: {
          verified: true,
          source: 'demo',
          checks: [
            { id: 'real', label: 'Real camera photo, not AI-made', pass: true },
            { id: 'place', label: 'Same place as the report', pass: true },
            { id: 'clean', label: 'Area now looks clean', pass: true },
            { id: 'fresh', label: 'Photo taken recently', pass: true },
          ],
          cleanliness: 88,
        },
      }
      timeline.push({ type: 'cleaned', at, by: ids[d.cleanBy], text: `Cleaned by ${cleaner.name} · AI verified the proof photo` })
    }
    return {
      id: newId('r_'),
      createdBy: ids[d.by],
      createdAt,
      photo: sceneArt(d.kind, true, i + 1),
      location,
      landmark: d.landmark,
      ward,
      department: d.cat,
      ai: {
        source: 'demo',
        is_garbage_scene: true,
        title: d.title,
        summary: `${d.waste.join(', ')} spotted at ${d.landmark}.`,
        waste_types: d.waste,
        primary_category: d.cat,
        severity: d.sev,
        volume: d.vol,
        hazards: d.hazards,
        environment: d.env,
        recommended_action: `Deploy a ${d.vol.startsWith('Small') ? 'two-person team' : d.vol.startsWith('Medium') ? 'handcart crew' : 'tipper truck and crew'} and segregate waste at source.`,
        urgency_hours: d.urg,
        complaint_text: complaintText(dept, ward, d),
        confidence: 0.86,
      },
      seenBy: d.seen.map((k) => ids[k]),
      seenExtra: d.extra,
      status,
      timeline,
      cleanup,
      attempts: [],
    }
  })
}
