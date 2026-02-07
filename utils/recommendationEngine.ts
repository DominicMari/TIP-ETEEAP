// utils/recommendationEngine.ts

interface DegreeRule {
  id: string;
  name: string;
  keywords: string[];
}

// Based on the specific TIP ETEEAP offerings
const DEGREE_RULES: DegreeRule[] = [
  // --- COMPUTING PROGRAMS ---
  {
    id: 'BSCS',
    name: 'Bachelor of Science in Computer Science',
    keywords: ['algorithm', 'theory', 'machine learning', 'ai', 'logic', 'math', 'science', 'computational', 'research', 'develop', 'coding', 'artificial intelligence'],
  },
  {
    id: 'BSIS',
    name: 'Bachelor of Science in Information Systems',
    keywords: ['business process', 'enterprise', 'database', 'analyst', 'crm', 'erp', 'management system', 'corporate data', 'audit', 'strategy', 'information'],
  },
  {
    id: 'BSIT',
    name: 'Bachelor of Science in Information Technology',
    keywords: ['network', 'web', 'support', 'technician', 'hardware', 'server', 'cloud', 'cybersecurity', 'admin', 'install', 'troubleshoot', 'application'],
  },
  {
    id: 'BSCpE',
    name: 'Bachelor of Science in Computer Engineering',
    keywords: ['embedded', 'circuit', 'robotics', 'electronics', 'iot', 'hardware', 'microcontroller', 'firmware', 'automation', 'sensor', 'electrical'],
  },

  // --- ENGINEERING ---
  {
    id: 'BSIE',
    name: 'Bachelor of Science in Industrial Engineering',
    keywords: ['production', 'manufacturing', 'quality', 'process', 'efficiency', 'optimization', 'operations', 'factory', 'safety', 'ergonomics', 'lean', 'six sigma'],
  },

  // --- BUSINESS ADMINISTRATION MAJORS ---
  {
    id: 'BSBA-LSCM',
    name: 'BSBA - Logistics and Supply Chain Management',
    keywords: ['logistics', 'supply chain', 'warehouse', 'inventory', 'shipping', 'transport', 'distribution', 'procurement', 'freight', 'delivery', 'cargo'],
  },
  {
    id: 'BSBA-FM',
    name: 'BSBA - Financial Management',
    keywords: ['finance', 'bank', 'money', 'investment', 'accounting', 'budget', 'audit', 'tax', 'wealth', 'treasury', 'loan', 'credit', 'financial'],
  },
  {
    id: 'BSBA-HRM',
    name: 'BSBA - Human Resources Management',
    keywords: ['human resources', 'hr', 'recruitment', 'hiring', 'training', 'employee', 'payroll', 'personnel', 'talent', 'staffing', 'workforce', 'labor'],
  },
  {
    id: 'BSBA-MM',
    name: 'BSBA - Marketing Management',
    keywords: ['marketing', 'sales', 'advertising', 'brand', 'social media', 'promotion', 'campaign', 'customer', 'public relations', 'digital marketing', 'selling'],
  }
];

export function getRecommendedDegree(jobTitle: string, skills: string, duties: string) {
  // Combine all user input into one big lowercase string for easy searching
  const userProfile = `${jobTitle} ${skills} ${duties}`.toLowerCase();

  // Calculate scores
  const scores = DEGREE_RULES.map((degree) => {
    let score = 0;

    degree.keywords.forEach((word) => {
      // Check if the user profile contains the keyword
      if (userProfile.includes(word)) {
        score += 1;
        
        // BONUS: If the exact degree name part (e.g., "marketing") is found, give extra points
        if (userProfile.includes(degree.name.split(' - ')[1]?.toLowerCase() || 'xyz')) {
           score += 2; 
        }
      }
    });

    return { ...degree, score };
  });

  // Sort by highest score first
  const rankedDegrees = scores.sort((a, b) => b.score - a.score);

  // Return top 3 results, but only if they have a score > 0
  return rankedDegrees.filter(d => d.score > 0).slice(0, 3);
}