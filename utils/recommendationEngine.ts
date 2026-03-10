// utils/recommendationEngine.ts
// Random Forest Degree Recommendation Engine for TIP ETEEAP

// ═══════════════════════════════════════════════════════════
// SECTION 1: TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════

interface ApplicantInput {
  jobTitle: string;
  industry: string;
  skills: string;
  duties: string;
  educationalBackground: string;
  certifications: string;
  recognition: string;
}

interface TrainingRow extends ApplicantInput {
  label: string; // recommended_degree_id
}

interface PredictionResult {
  id: string;
  name: string;
  score: number;
  confidence: number;
  matchLabel: 'Strong Match' | 'Good Match' | 'Possible Match'; // ← add this
  reasons: string[];
}

interface TreeNode {
  featureIndex: number;
  threshold: number;
  left: TreeNode | null;
  right: TreeNode | null;
  classCounts: Record<string, number> | null; // leaf only
}

interface RandomForestConfig {
  nTrees: number;
  maxDepth: number;
  minSamplesSplit: number;
  featureSampleSize: number;
  seed: number;
}

// ═══════════════════════════════════════════════════════════
// SECTION 2: DEGREE METADATA & KEYWORD DICTIONARIES
// ═══════════════════════════════════════════════════════════

const DEGREE_IDS = [
  'BSCS', 'BSIS', 'BSIT', 'BSCpE', 'BSIE',
  'BSBA-LSCM', 'BSBA-FM', 'BSBA-HRM', 'BSBA-MM',
] as const;

type DegreeId = typeof DEGREE_IDS[number];

const DEGREE_NAMES: Record<DegreeId, string> = {
  'BSCS': 'Bachelor of Science in Computer Science',
  'BSIS': 'Bachelor of Science in Information Systems',
  'BSIT': 'Bachelor of Science in Information Technology',
  'BSCpE': 'Bachelor of Science in Computer Engineering',
  'BSIE': 'Bachelor of Science in Industrial Engineering',
  'BSBA-LSCM': 'BSBA - Logistics and Supply Chain Management',
  'BSBA-FM': 'BSBA - Financial Management',
  'BSBA-HRM': 'BSBA - Human Resources Management',
  'BSBA-MM': 'BSBA - Marketing Management',
};

// Per-degree keyword dictionaries (unigrams + phrases)
const DOMAIN_KEYWORDS: Record<DegreeId, string[]> = {
  'BSCS': [
    'algorithm', 'machine learning', 'ai', 'artificial intelligence', 'neural network',
    'deep learning', 'data structure', 'software engineer', 'computer vision',
    'natural language processing', 'nlp', 'computational', 'cryptography',
    'distributed systems', 'coding', 'programming', 'python', 'java', 'c++',
    'data science', 'software development', 'api design', 'blockchain',
    'agile', 'system design', 'microservices', 'unit testing', 'code review',
    'functional programming', 'multithreading', 'compiler', 'git',
    'feature engineering', 'data pipeline', 'rest api', 'linear algebra',
    'computer architecture', 'operating system', 'software testing',
  ],
  'BSIS': [
    'business process', 'enterprise', 'database', 'analyst', 'crm', 'erp',
    'management system', 'corporate data', 'information system', 'stakeholder',
    'business intelligence', 'data governance', 'it audit', 'it project',
    'bpmn', 'system integration', 'cloud erp', 'data analysis', 'dashboard',
    'business requirement', 'kpi', 'data migration', 'user acceptance testing',
    'itil', 'cobit', 'vendor management', 'report generation', 'togaf',
    'information security', 'enterprise architecture', 'business strategy',
    'tableau', 'power bi', 'sql', 'oracle', 'sap',
  ],
  'BSIT': [
    'network', 'web developer', 'technician', 'server', 'cloud',
    'cybersecurity', 'troubleshoot', 'helpdesk', 'help desk', 'firewall',
    'active directory', 'windows server', 'linux', 'vmware', 'virtualization',
    'dns', 'dhcp', 'vpn', 'backup', 'disaster recovery', 'patch management',
    'endpoint', 'office 365', 'azure', 'aws', 'docker', 'ccna',
    'routing', 'switching', 'it support', 'web server', 'apache', 'nginx',
    'powershell', 'bash', 'scripting', 'mobile device management',
    'penetration testing', 'siem', 'it infrastructure', 'security',
  ],
  'BSCpE': [
    'embedded', 'circuit', 'robotics', 'electronics', 'iot',
    'microcontroller', 'firmware', 'sensor', 'electrical', 'fpga',
    'pcb', 'signal processing', 'assembly language', 'vhdl', 'verilog',
    'device driver', 'can bus', 'stm32', 'arduino', 'raspberry pi',
    'voltage regulator', 'thermal analysis', 'power consumption',
    'wireless sensor', 'automation', 'plc', 'scada', 'wearable',
    'battery', 'schematic', 'soldering', 'oscilloscope', 'emc',
    'zigbee', 'mqtt', 'ble', 'bluetooth', 'kicad', 'altium',
  ],
  'BSIE': [
    'production', 'manufacturing', 'quality', 'process optimization',
    'efficiency', 'operations', 'factory', 'safety', 'ergonomics',
    'lean', 'six sigma', 'kaizen', '5s', 'value stream', 'osha',
    'time and motion', 'poka-yoke', 'root cause analysis', 'fishbone',
    'gantt chart', 'simulation', 'facility layout', 'material flow',
    'statistical process control', 'gmp', 'fmea', 'oee',
    'bottleneck', 'work measurement', 'capacity planning',
    'inventory management', 'minitab', 'solidworks', 'autocad',
    'regression analysis', 'linear programming', 'supply planning',
  ],
  'BSBA-LSCM': [
    'logistics', 'supply chain', 'warehouse', 'inventory', 'shipping',
    'transport', 'distribution', 'procurement', 'freight', 'delivery',
    'cargo', 'fleet', 'customs', 'import', 'export', 'incoterms',
    'bill of lading', 'wms', 'tms', 'rfid', 'barcode',
    'demand forecasting', 'reverse logistics', 'cold chain',
    'last mile', 'load planning', 'container', 'forklift',
    'cycle count', 'safety stock', 'reorder point', 'abc analysis',
    'vendor evaluation', 'supplier', 'sap mm', 'hazardous material',
    'ltl', 'ftl', 'cross-docking', 'order fulfillment',
  ],
  'BSBA-FM': [
    'finance', 'bank', 'investment', 'accounting', 'budget', 'audit',
    'tax', 'treasury', 'loan', 'credit', 'financial', 'gaap', 'ifrs',
    'accounts payable', 'accounts receivable', 'general ledger',
    'cash flow', 'balance sheet', 'income statement', 'depreciation',
    'capital budgeting', 'npv', 'irr', 'bloomberg', 'forex',
    'hedging', 'merger', 'acquisition', 'due diligence',
    'bookkeeping', 'payroll', 'xero', 'quickbooks', 'sap fico',
    'certified public accountant', 'cpa', 'fraud', 'compliance',
    'revenue forecasting', 'cost analysis', 'variance analysis',
  ],
  'BSBA-HRM': [
    'human resources', 'hr', 'recruitment', 'hiring', 'training',
    'employee', 'payroll', 'personnel', 'talent', 'staffing',
    'workforce', 'labor', 'onboarding', 'performance management',
    'compensation', 'benefits', 'grievance', 'disciplinary',
    'labor relations', 'collective bargaining', 'union',
    'manpower planning', 'succession planning', 'hris',
    'bamboohr', 'sap successfactors', 'applicant tracking',
    'job evaluation', 'employee engagement', 'retention',
    'exit interview', 'turnover', 'diversity', 'inclusion',
    'organizational development', 'workplace safety',
  ],
  'BSBA-MM': [
    'marketing', 'sales', 'advertising', 'brand', 'social media',
    'promotion', 'campaign', 'customer', 'public relations',
    'digital marketing', 'seo', 'sem', 'google ads', 'analytics',
    'content creation', 'influencer', 'email marketing', 'crm',
    'market research', 'consumer behavior', 'segmentation',
    'lead generation', 'visual merchandising', 'retail',
    'competitive analysis', 'go-to-market', 'tiktok', 'instagram',
    'video marketing', 'loyalty program', 'trade show',
    'adobe creative suite', 'hootsuite', 'copywriting',
    'customer journey', 'conversion', 'engagement',
  ],
};

// Field weights for feature extraction
const FIELD_WEIGHTS: Record<string, number> = {
  jobTitle: 2.0,
  industry: 1.5,
  skills: 1.8,
  duties: 1.8,
  educationalBackground: 1.2,
  certifications: 1.4,
  recognition: 0.6,
};

const FIELD_KEYS: (keyof ApplicantInput)[] = [
  'jobTitle', 'industry', 'skills', 'duties',
  'educationalBackground', 'certifications', 'recognition',
];

// Feature vector length: 9 degrees × 7 fields + 3 global metrics = 66
const FEATURE_LENGTH = 66;

// ═══════════════════════════════════════════════════════════
// SECTION 3: TEXT NORMALIZATION & TOKENIZATION
// ═══════════════════════════════════════════════════════════

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): { unigrams: string[]; bigrams: string[] } {
  const words = text.split(' ').filter(w => w.length > 0);
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return { unigrams: words, bigrams };
}

// ═══════════════════════════════════════════════════════════
// SECTION 4: FEATURE EXTRACTION PIPELINE
// ═══════════════════════════════════════════════════════════

function scoreFieldForDegree(normalizedText: string, degreeId: DegreeId): number {
  if (!normalizedText) return 0;
  const keywords = DOMAIN_KEYWORDS[degreeId];
  const { unigrams } = tokenize(normalizedText);
  let score = 0;

  // Build word boundary pattern for whole-word matching
  const wordBoundaryText = ` ${normalizedText} `; // Add spaces for boundary checks

  for (const keyword of keywords) {
    if (keyword.includes(' ')) {
      // Phrase match: must match with word boundaries
      const phrasePattern = ` ${keyword} `;
      if (wordBoundaryText.includes(phrasePattern)) {
        score += 2;
      }
    } else {
      // Unigram match: only exact whole-word matches
      if (unigrams.includes(keyword)) {
        score += 1;
      }
    }
  }
  return score;
}

function extractFeatures(input: ApplicantInput): number[] {
  const features: number[] = [];
  let totalTokens = 0;
  const uniqueTokenSet = new Set<string>();
  let totalPhraseMatches = 0;

  // For each field, compute 9 degree scores
  for (const field of FIELD_KEYS) {
    const raw = input[field] || '';
    const normalized = normalizeText(raw);
    const { unigrams } = tokenize(normalized);
    totalTokens += unigrams.length;
    unigrams.forEach(t => uniqueTokenSet.add(t));

    const weight = FIELD_WEIGHTS[field];

    for (const degreeId of DEGREE_IDS) {
      const rawScore = scoreFieldForDegree(normalized, degreeId);
      features.push(rawScore * weight);
      // Count phrase matches for global metric
      const keywords = DOMAIN_KEYWORDS[degreeId];
      for (const kw of keywords) {
        if (kw.includes(' ') && normalized.includes(kw)) {
          totalPhraseMatches++;
        }
      }
    }
  }

  // 3 global metrics
  features.push(totalTokens);
  features.push(uniqueTokenSet.size);
  features.push(totalPhraseMatches);

  return features;
}

// ═══════════════════════════════════════════════════════════
// SECTION 4B: REASON GENERATION & INPUT GUIDANCE
// ═══════════════════════════════════════════════════════════

const DEGREE_FOCUS_LABELS: Record<DegreeId, string> = {
  'BSCS': 'software development, algorithms, and AI/machine learning',
  'BSIS': 'business processes, enterprise systems, and IT governance',
  'BSIT': 'networking, cloud infrastructure, and cybersecurity',
  'BSCpE': 'embedded systems, electronics, and hardware engineering',
  'BSIE': 'manufacturing optimization, quality control, and process engineering',
  'BSBA-LSCM': 'logistics, warehousing, and supply chain operations',
  'BSBA-FM': 'finance, accounting, and investment management',
  'BSBA-HRM': 'human resources, recruitment, and workforce development',
  'BSBA-MM': 'marketing, branding, and digital advertising',
};

function generateReasons(input: ApplicantInput, degreeId: DegreeId): string[] {
  const reasons: string[] = [];
  const keywords = DOMAIN_KEYWORDS[degreeId];
  const fieldLabels: Record<keyof ApplicantInput, string> = {
    jobTitle: 'job title',
    industry: 'industry',
    skills: 'skills',
    duties: 'duties',
    educationalBackground: 'educational background',
    certifications: 'certifications',
    recognition: 'recognition',
  };

  // Find which fields contributed matching keywords
  const fieldMatches: Record<string, string[]> = {};
  for (const field of FIELD_KEYS) {
    const normalized = normalizeText(input[field] || '');
    if (!normalized) continue;
    const { unigrams } = tokenize(normalized);
    const wordBoundaryText = ` ${normalized} `;
    const matched: string[] = [];
    
    for (const kw of keywords) {
      if (kw.includes(' ')) {
        // Phrase: check with word boundaries
        if (wordBoundaryText.includes(` ${kw} `)) matched.push(kw);
      } else {
        // Unigram: exact word match only
        if (unigrams.includes(kw)) matched.push(kw);
      }
    }
    
    if (matched.length > 0) {
      fieldMatches[fieldLabels[field]] = matched.slice(0, 3);
    }
  }

  // Build human-readable reasons from matches
  const fieldSentences: Record<string, (kws: string[]) => string> = {
    'skills':                 (kws) => `You have hands-on skills in ${kws.join(', ')}, which are core to this program.`,
    'duties':                 (kws) => `Your work responsibilities — like ${kws.join(' and ')} — closely align with this field.`,
    'job title':              (kws) => `Your job title reflects relevant experience in ${kws.join(', ')}.`,
    'industry':               (kws) => `Your industry background in ${kws.join(', ')} is a strong match.`,
    'educational background': (kws) => `Your educational background includes relevant exposure to ${kws.join(', ')}.`,
    'certifications':         (kws) => `Your certifications demonstrate expertise in ${kws.join(', ')}.`,
    'recognition':            (kws) => `Your recognition highlights performance in areas related to ${kws.join(', ')}.`,
  };

  for (const [fieldName, matched] of Object.entries(fieldMatches)) {
    const formatter = fieldSentences[fieldName];
    if (formatter) reasons.push(formatter(matched));
  }

  // Add a focus summary if we have reasons
  if (reasons.length > 0) {
    reasons.push(`This program focuses on ${DEGREE_FOCUS_LABELS[degreeId]}`);
  }

  return reasons;
}

const GUIDANCE_PROMPTS = [
  'Try describing what kind of work you do or want to do (e.g., "I manage warehouse inventory and coordinate shipments").',
  'Mention specific skills you have (e.g., "programming", "accounting", "recruitment", "network administration").',
  'Include your industry or field (e.g., "I work in a manufacturing plant", "I handle marketing campaigns").',
  'Describe your daily responsibilities or duties at work.',
];

export function getInputGuidance(text: string): { isReady: boolean; message: string; suggestions: string[] } {
  const normalized = normalizeText(text);
  const { unigrams } = tokenize(normalized);

  if (!normalized || normalized.length < 10) {
    return {
      isReady: false,
      message: 'Please write about your goals, work experience, or skills so we can recommend the best degree for you.',
      suggestions: GUIDANCE_PROMPTS,
    };
  }

  // Check if any degree keywords are detected at all
  let totalHits = 0;
  for (const degreeId of DEGREE_IDS) {
    totalHits += scoreFieldForDegree(normalized, degreeId);
  }

  if (totalHits < 2) {
    return {
      isReady: false,
      message: 'We need a bit more detail to make a good recommendation. Try adding more about your background.',
      suggestions: [
        'What is your current or most recent job title?',
        'What specific tasks or responsibilities do you handle?',
        'What tools, software, or equipment do you regularly use?',
        'What industry or type of company do you work in?',
      ],
    };
  }

  return { isReady: true, message: '', suggestions: [] };
}

// ═══════════════════════════════════════════════════════════
// SECTION 5: SEEDED RANDOM NUMBER GENERATOR
// ═══════════════════════════════════════════════════════════

class SeededRNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    // Mulberry32 PRNG
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // Random integer in [0, max)
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
  // Shuffle array in place (Fisher-Yates)
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  // Sample k indices from [0, n)
  sampleIndices(n: number, k: number): number[] {
    const indices = Array.from({ length: n }, (_, i) => i);
    this.shuffle(indices);
    return indices.slice(0, Math.min(k, n));
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 6: DECISION TREE (CART WITH GINI IMPURITY)
// ═══════════════════════════════════════════════════════════

function giniImpurity(counts: Record<string, number>, total: number): number {
  if (total === 0) return 0;
  let sumSq = 0;
  for (const key in counts) {
    const p = counts[key] / total;
    sumSq += p * p;
  }
  return 1 - sumSq;
}

function countClasses(labels: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of labels) {
    counts[l] = (counts[l] || 0) + 1;
  }
  return counts;
}

function findBestSplit(
  X: number[][],
  y: string[],
  featureSubset: number[]
): { featureIndex: number; threshold: number; leftMask: boolean[] } | null {
  const n = X.length;
  if (n < 2) return null;

  let bestGini = Infinity;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeftMask: boolean[] = [];

  for (const fi of featureSubset) {
    // Gather unique sorted values for this feature
    const vals = X.map(row => row[fi]);
    const sorted = [...new Set(vals)].sort((a, b) => a - b);
    if (sorted.length < 2) continue;

    // Try midpoints as thresholds
    for (let i = 0; i < sorted.length - 1; i++) {
      const threshold = (sorted[i] + sorted[i + 1]) / 2;
      const leftMask = vals.map(v => v <= threshold);
      const leftLabels = y.filter((_, idx) => leftMask[idx]);
      const rightLabels = y.filter((_, idx) => !leftMask[idx]);

      if (leftLabels.length === 0 || rightLabels.length === 0) continue;

      const leftCounts = countClasses(leftLabels);
      const rightCounts = countClasses(rightLabels);
      const gL = giniImpurity(leftCounts, leftLabels.length);
      const gR = giniImpurity(rightCounts, rightLabels.length);
      const weightedGini = (leftLabels.length * gL + rightLabels.length * gR) / n;

      if (weightedGini < bestGini) {
        bestGini = weightedGini;
        bestFeature = fi;
        bestThreshold = threshold;
        bestLeftMask = leftMask;
      }
    }
  }

  if (bestFeature === -1) return null;
  return { featureIndex: bestFeature, threshold: bestThreshold, leftMask: bestLeftMask };
}

function buildTree(
  X: number[][],
  y: string[],
  depth: number,
  maxDepth: number,
  minSamplesSplit: number,
  featureSampleSize: number,
  rng: SeededRNG
): TreeNode {
  const classCounts = countClasses(y);
  const classKeys = Object.keys(classCounts);

  // Leaf conditions: pure node, max depth, or too few samples
  if (classKeys.length === 1 || depth >= maxDepth || y.length < minSamplesSplit) {
    return { featureIndex: -1, threshold: 0, left: null, right: null, classCounts };
  }

  // Select random feature subset
  const featureSubset = rng.sampleIndices(X[0].length, featureSampleSize);
  const split = findBestSplit(X, y, featureSubset);

  if (!split) {
    return { featureIndex: -1, threshold: 0, left: null, right: null, classCounts };
  }

  const leftX: number[][] = [];
  const leftY: string[] = [];
  const rightX: number[][] = [];
  const rightY: string[] = [];

  for (let i = 0; i < X.length; i++) {
    if (split.leftMask[i]) {
      leftX.push(X[i]);
      leftY.push(y[i]);
    } else {
      rightX.push(X[i]);
      rightY.push(y[i]);
    }
  }

  return {
    featureIndex: split.featureIndex,
    threshold: split.threshold,
    left: buildTree(leftX, leftY, depth + 1, maxDepth, minSamplesSplit, featureSampleSize, rng),
    right: buildTree(rightX, rightY, depth + 1, maxDepth, minSamplesSplit, featureSampleSize, rng),
    classCounts: null,
  };
}

function predictTree(node: TreeNode, features: number[]): Record<string, number> {
  // Leaf node
  if (node.classCounts !== null) {
    return node.classCounts;
  }
  if (features[node.featureIndex] <= node.threshold) {
    return predictTree(node.left!, features);
  }
  return predictTree(node.right!, features);
}

// ═══════════════════════════════════════════════════════════
// SECTION 7: RANDOM FOREST CLASSIFIER
// ═══════════════════════════════════════════════════════════

class RandomForestClassifier {
  private trees: TreeNode[] = [];
  private config: RandomForestConfig;
  private trained = false;

  constructor(config?: Partial<RandomForestConfig>) {
    this.config = {
      nTrees: config?.nTrees ?? 100,
      maxDepth: config?.maxDepth ?? 12,
      minSamplesSplit: config?.minSamplesSplit ?? 3,
      featureSampleSize: config?.featureSampleSize ?? Math.floor(Math.sqrt(FEATURE_LENGTH)),
      seed: config?.seed ?? 42,
    };
  }

  train(X: number[][], y: string[]): void {
    const rng = new SeededRNG(this.config.seed);
    this.trees = [];

    for (let t = 0; t < this.config.nTrees; t++) {
      // Bootstrap sampling
      const bootstrapX: number[][] = [];
      const bootstrapY: string[] = [];
      for (let i = 0; i < X.length; i++) {
        const idx = rng.nextInt(X.length);
        bootstrapX.push(X[idx]);
        bootstrapY.push(y[idx]);
      }

      const tree = buildTree(
        bootstrapX, bootstrapY,
        0, this.config.maxDepth,
        this.config.minSamplesSplit,
        this.config.featureSampleSize,
        rng,
      );
      this.trees.push(tree);
    }
    this.trained = true;
  }

  predict(features: number[]): Record<string, number> {
    if (!this.trained || this.trees.length === 0) return {};
    const aggregated: Record<string, number> = {};

    for (const tree of this.trees) {
      const leafCounts = predictTree(tree, features);
      // Cast vote based on majority class of leaf
      let bestClass = '';
      let bestCount = 0;
      for (const cls in leafCounts) {
        if (leafCounts[cls] > bestCount) {
          bestCount = leafCounts[cls];
          bestClass = cls;
        }
      }
      if (bestClass) {
        aggregated[bestClass] = (aggregated[bestClass] || 0) + 1;
      }
    }
    return aggregated;
  }

  isReady(): boolean {
    return this.trained;
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 8: MODEL SINGLETON & TRAINING DATA
// ═══════════════════════════════════════════════════════════

let forestModel: RandomForestClassifier | null = null;

function getOrTrainModel(): RandomForestClassifier {
  if (forestModel && forestModel.isReady()) return forestModel;

  // Convert embedded training data to feature vectors
  const X: number[][] = [];
  const y: string[] = [];

  for (const row of TRAINING_DATA) {
    const input: ApplicantInput = {
      jobTitle: row.job_title,
      industry: row.industry,
      skills: row.skills,
      duties: row.duties,
      educationalBackground: row.educational_background,
      certifications: row.certifications,
      recognition: row.recognition,
    };
    X.push(extractFeatures(input));
    y.push(row.label);
  }

  forestModel = new RandomForestClassifier({
    nTrees: 100,
    maxDepth: 12,
    minSamplesSplit: 3,
    seed: 42,
  });
  forestModel.train(X, y);
  return forestModel;
}

// ═══════════════════════════════════════════════════════════
// SECTION 9: EMBEDDED TRAINING DATA (from RecoSys table)
// Kept as a compact array to avoid runtime DB dependency.
// To update: export from public."RecoSys" and replace below.
// ═══════════════════════════════════════════════════════════

interface TrainingDataRow {
  job_title: string;
  industry: string;
  skills: string;
  duties: string;
  educational_background: string;
  certifications: string;
  recognition: string;
  label: string;
}

const TRAINING_DATA: TrainingDataRow[] = [
  { job_title: "Channel Marketing Manager", industry: "telecommunications marketing", skills: "lead generation, consumer behavior analysis, content creation, competitive analysis, go-to-market planning, analytical thinking, SEM search engine marketing", duties: "train and mentor sales team on product knowledge and selling techniques; manage influencer partnerships and coordinate sponsored content campaigns", educational_background: "ALS Certification with retail and sales background", certifications: "Market Research Society Certificate, Hootsuite Social Marketing Certification", recognition: "Productivity Award", label: "BSBA-MM" },
  { job_title: "Network Engineer", industry: "banking IT department", skills: "switch and router configuration, Office 365 administration, database administration, communication skills, customer service, network administration, Group Policy configuration, cybersecurity fundamentals, MySQL database management", duties: "configure VLAN segmentation for network security and performance; follow company policies and standard operating procedures; deploy and manage cloud infrastructure on AWS and Azure platforms", educational_background: "Technical-Vocational in Computer Hardware Servicing", certifications: "Red Hat Certified System Administrator, VMware Certified Professional", recognition: "Community Service Citation", label: "BSIT" },
  { job_title: "Growth Hacker", industry: "food and beverage company", skills: "communication skills, customer segmentation, video marketing, trade show management, teamwork, data-driven marketing, TikTok marketing, retail marketing, customer journey mapping, Adobe Creative Suite basics, conflict resolution", duties: "conduct competitive analysis and identify market opportunities and threats; develop content marketing strategies including blogs videos and infographics; develop customer segmentation models and targeted marketing programs; attend team meetings and provide regular status updates; manage visual merchandising and in-store promotional displays", educational_background: "Some College units in Business Administration", certifications: "Google Ads Certification, Google Analytics Individual Qualification", recognition: "Best Team Player Award", label: "BSBA-MM" },
  { job_title: "Systems Programmer", industry: "fintech startup", skills: "algorithm design, software testing, attention to detail, Java programming, technical documentation, unit testing, R programming, conflict resolution, operating systems concepts", duties: "implement NLP models for text classification and sentiment analysis; design and implement graph-based algorithms for network analysis; build recommendation systems using collaborative filtering techniques", educational_background: "ALS Certification with programming background", certifications: "Certified Kubernetes Administrator, Certified Scrum Developer", recognition: "Outstanding Performance Award", label: "BSCS" },
  { job_title: "Corporate Finance Analyst", industry: "tax consultancy", skills: "adaptability, activity-based costing, organizational skills, regulatory compliance, loan underwriting, problem solving, bank reconciliation, budgeting and forecasting", duties: "manage fixed asset records including depreciation calculations; ensure compliance with accounting standards and regulatory requirements; analyze cost structures and recommend cost reduction opportunities", educational_background: "Technical-Vocational in Accounting Technology", certifications: "Bookkeeping TESDA NCII, Excel Expert Certification, Certified Fraud Examiner", recognition: "Outstanding Performance Award", label: "BSBA-FM" },
  { job_title: "Web Developer", industry: "IT services company", skills: "Hyper-V management, Nagios monitoring, mobile device management, MySQL database management, adaptability, SIEM tools operation, network cabling, help desk support", duties: "provide training to staff on IT tools and security best practices; perform regular system backups and test disaster recovery procedures", educational_background: "High School Graduate with TESDA IT certification", certifications: "ITIL Foundation, Microsoft Certified Azure Administrator, Palo Alto Networks Certified Cybersecurity Associate", recognition: "Years of Service Award", label: "BSIT" },
  { job_title: "IT Trainer", industry: "healthcare IT department", skills: "leadership, PowerShell scripting, AWS cloud services, organizational skills, Group Policy configuration, Nginx configuration, collaboration, Linux server administration", duties: "manage endpoint security solutions and antivirus deployments; coordinate with vendors for hardware procurement and warranty support; implement cybersecurity measures including firewalls and intrusion detection; provide training to staff on IT tools and security best practices", educational_background: "Some College units in Information Systems", certifications: "CompTIA Security+, CompTIA Network+, AWS Certified Cloud Practitioner", recognition: "Productivity Award", label: "BSIT" },
  { job_title: "Packaging Engineer", industry: "energy production facility", skills: "data visualization, value stream mapping, Minitab statistical software, process optimization, production planning, GMP good manufacturing practices, time management, SolidWorks 3D modeling", duties: "perform FMEA analysis to identify and mitigate potential failure modes; conduct time and motion studies to establish standard work procedures; analyze operational data to identify trends and recommend improvements; participate in professional development and training seminars; calculate overall equipment effectiveness and develop improvement plans", educational_background: "Technical-Vocational in Machine Operation", certifications: "Certified Safety Professional, Lean Six Sigma Green Belt", recognition: "Innovation Award", label: "BSIE" },
  { job_title: "CRM Administrator", industry: "banking institution", skills: "business intelligence, BPMN notation, project management, analytical thinking, report writing, compliance management", duties: "evaluate and recommend technology solutions to support business strategy; conduct cost-benefit analysis for proposed technology investments; design and implement data governance frameworks for corporate data assets; manage multiple priorities and meet deadlines consistently", educational_background: "Associate in Office Administration", certifications: "TOGAF Certified", recognition: "Innovation Award", label: "BSIS" },
  { job_title: "Software Quality Engineer", industry: "cybersecurity firm", skills: "feature engineering, conflict resolution, organizational skills, functional programming, creativity, C++ programming, API design, system design, Linux operating system, cryptography fundamentals", duties: "design scalable system architecture for high-traffic applications; implement automated testing suites for quality assurance; deploy machine learning models to production environments; integrate third-party APIs and services into existing applications", educational_background: "Associate in Computer Technology", certifications: "Python Institute PCEP/PCAP, Meta Backend Developer Certificate, MongoDB Certified Developer", recognition: "Leadership Excellence Award", label: "BSCS" },
  { job_title: "Bank Operations Officer", industry: "insurance company", skills: "cash flow analysis, capital budgeting, decision making, conflict resolution, treasury management, income statement analysis, financial databases", duties: "ensure compliance with accounting standards and regulatory requirements; conduct financial health assessments for clients and businesses", educational_background: "High School Graduate with banking experience", certifications: "Certified Internal Auditor, Financial Risk Manager FRM, SAP FICO Certification", recognition: "Best Project Award", label: "BSBA-FM" },
  { job_title: "Systems Analyst", industry: "healthcare management", skills: "SQL querying, report writing, project management, decision making, negotiation skills, corporate data management, vendor management, user acceptance testing, technical writing, COBIT framework, report generation", duties: "analyze business processes and identify areas for improvement using enterprise systems; manage vendor relationships and evaluate enterprise software solutions; create detailed process flow diagrams and system documentation", educational_background: "Some College units in Information Systems", certifications: "TOGAF Certified", recognition: "Employee of the Month", label: "BSIS" },
  { job_title: "Cargo Operations Manager", industry: "airline cargo operations", skills: "SAP Materials Management, customer service, organizational skills, fleet management operations, cost optimization strategies, cold chain management", duties: "develop contingency plans for supply chain disruptions and risk events; optimize inventory levels to minimize carrying costs while meeting demand; implement barcode and RFID systems for real-time inventory visibility", educational_background: "Some College units in Logistics Management", certifications: "Six Sigma Yellow Belt, Warehouse Management Certification", recognition: "Community Service Citation", label: "BSBA-LSCM" },
  { job_title: "Auditor", industry: "tax consultancy", skills: "IFRS financial reporting, Bloomberg terminal operation, accounts payable processing, merger and acquisition analysis, regulatory compliance, English language proficiency, payroll processing", duties: "conduct internal audits to verify accuracy of financial records and controls; conduct variance analysis to identify budget deviations and root causes; perform due diligence for merger and acquisition transactions", educational_background: "Some College units in Accountancy", certifications: "Certified Public Accountant CPA, Certified Internal Auditor", recognition: "Industry Recognition Award", label: "BSBA-FM" },
  { job_title: "Computer Vision Engineer", industry: "research laboratory", skills: "MongoDB, code review, neural networks, API design, Filipino language proficiency, agile methodology, data pipeline development, computer architecture", duties: "manage multiple priorities and meet deadlines consistently; develop mobile applications using cross-platform frameworks; design database schemas and optimize query performance; design and implement efficient algorithms for complex computational problems", educational_background: "Some College units in Software Engineering", certifications: "TensorFlow Developer Certificate", recognition: "Innovation Award", label: "BSCS" },
  { job_title: "Database Analyst", industry: "pharmaceutical company", skills: "performance monitoring, UML diagrams, public speaking, corporate data management, Filipino language proficiency, information security management, risk assessment", duties: "design automated workflows for approval processes and notifications; manage vendor relationships and evaluate enterprise software solutions; collaborate with colleagues to achieve department objectives; establish KPIs and metrics to measure business process effectiveness; gather and document business requirements from stakeholders across departments", educational_background: "Associate in Office Administration", certifications: "Microsoft Certified Data Analyst Associate, Certified Business Analysis Professional, Tableau Desktop Specialist", recognition: "Years of Service Award", label: "BSIS" },
  { job_title: "Customs Broker Assistant", industry: "cold storage facility", skills: "Power BI dashboards, problem solving, contract negotiation, WMS warehouse management systems, leadership, material requirements planning, attention to detail", duties: "manage freight audit and payment processes for accurate billing; prepare reports and documentation for management review; conduct ABC analysis to categorize inventory by value and turnover; coordinate shipment schedules with carriers and freight forwarders", educational_background: "Associate in Business Management", certifications: "Warehouse Management Certification, Fleet Management Professional Certificate", recognition: "Years of Service Award", label: "BSBA-LSCM" },
  { job_title: "Diversity and Inclusion Specialist", industry: "BPO company HR", skills: "workplace safety compliance, BambooHR, job evaluation methods, labor relations management, payroll processing, English language proficiency, creativity, instructional design", duties: "manage end-to-end recruitment process from sourcing to onboarding; manage employee onboarding and orientation programs for new hires; conduct exit interviews and analyze turnover data for retention strategies; facilitate conflict resolution and mediation between employees and teams", educational_background: "Associate in Business Management", certifications: "Organizational Development Certified Professional", recognition: "Customer Service Excellence Award", label: "BSBA-HRM" },
  { job_title: "Financial Analyst", industry: "fintech company", skills: "creativity, financial databases, general ledger management, loan underwriting, anti-money laundering, IFRS financial reporting, public speaking, bank reconciliation", duties: "develop revenue forecasting models based on historical data and trends; prepare audit schedules and coordinate with external audit teams", educational_background: "Some College units in Accountancy", certifications: "Insurance Certification", recognition: "Industry Recognition Award", label: "BSBA-FM" },
  { job_title: "Microcontroller Programmer", industry: "defense contractor", skills: "professionalism, battery circuit design, signal processing, VHDL hardware description, sensor integration, circuit design and analysis", duties: "design ASIC and custom silicon for specialized computing applications; communicate with clients and stakeholders across the organization; write firmware for microcontrollers using C and assembly language; optimize power consumption in portable embedded devices", educational_background: "TESDA Electronics Products Assembly and Servicing NCII", certifications: "IPC-A-610 Certified, Certified LabVIEW Developer, Certified Automation Professional", recognition: "Community Service Citation", label: "BSCpE" },
  { job_title: "Tax Preparer", industry: "audit advisory firm", skills: "customer service, balance sheet analysis, report writing, Bloomberg terminal operation, treasury management, loan underwriting, NPV and IRR calculation", duties: "perform financial analysis to support business decision making and strategy; provide quality service to internal and external clients; process bank loans and manage debt portfolio and repayment schedules", educational_background: "ALS Certification with finance work background", certifications: "Insurance Certification", recognition: "Customer Service Excellence Award", label: "BSBA-FM" },
  { job_title: "Graphics Programmer", industry: "software development company", skills: "distributed systems, professionalism, REST API development, R programming, computer vision, operating systems concepts, critical thinking, communication skills, linear algebra, artificial intelligence", duties: "build blockchain-based decentralized applications; maintain accurate records and filing of department documents; build recommendation systems using collaborative filtering techniques; develop computer vision algorithms for object detection and tracking; perform root cause analysis on software defects", educational_background: "Some College units in Engineering", certifications: "IBM Data Science Professional Certificate, AWS Certified Developer, Google Professional Data Engineer", recognition: "Community Service Citation", label: "BSCS" },
  { job_title: "Job Analyst", industry: "management consulting company", skills: "recruitment and selection processes, employee engagement strategies, onboarding processes, report writing, grievance handling, LinkedIn Recruiter sourcing", duties: "handle disciplinary procedures and termination processes in compliance with policy; maintain accurate records and filing of department documents; handle employee relations issues including complaints and grievance procedures", educational_background: "High School Graduate with HR department experience", certifications: "Certified Training Professional, Labor Relations and Negotiations Certificate, Organizational Development Certified Professional", recognition: "Industry Recognition Award", label: "BSBA-HRM" },
  { job_title: "Labor Relations Officer", industry: "corporate HR department", skills: "pre-employment screening, instructional design, background verification processes, compensation analysis, manpower planning and forecasting, conflict resolution, SAP SuccessFactors, teamwork, report writing, applicant tracking systems, BambooHR", duties: "develop workforce planning models to forecast staffing requirements; handle disciplinary procedures and termination processes in compliance with policy", educational_background: "Some College units in Psychology", certifications: "HR Management Certificate TESDA", recognition: "Employee of the Month", label: "BSBA-HRM" },
  { job_title: "Capacity Planner", industry: "manufacturing plant", skills: "linear programming, data visualization, time management, Gantt chart scheduling, customer service, production planning, fishbone diagram, SolidWorks 3D modeling, regression analysis, self-motivation, inventory management", duties: "conduct root cause analysis on quality issues using structured methodologies; lead Six Sigma projects to reduce defects and improve quality metrics; conduct value stream mapping to visualize and improve process flows; design facility layouts to optimize material flow and minimize handling; attend team meetings and provide regular status updates", educational_background: "Technical-Vocational in Machine Operation", certifications: "Arena Simulation Certification, Lean Six Sigma Green Belt", recognition: "Community Service Citation", label: "BSIE" },
  { job_title: "Hardware Engineer", industry: "telecommunications equipment manufacturer", skills: "device driver development, self-motivation, DFM analysis, circuit design and analysis, electrical schematic reading, assembly language, voltage regulator design, thermal analysis, CAN bus protocol", duties: "perform EMC compliance testing and resolve electromagnetic interference issues; implement wireless sensor networks for environmental monitoring", educational_background: "TESDA Electronics Products Assembly and Servicing NCII", certifications: "Siemens PLC Certification, National Instruments Certified", recognition: "Community Service Citation", label: "BSCpE" },
  { job_title: "Research Scientist", industry: "artificial intelligence startup", skills: "Git version control, data pipeline development, AWS services, professionalism, artificial intelligence, negotiation skills, C++ programming, computational complexity analysis, communication skills, neural networks, agile methodology", duties: "lead technical design discussions and architecture reviews; implement automated testing suites for quality assurance; develop automated data validation and cleansing procedures; design and implement graph-based algorithms for network analysis", educational_background: "Technical-Vocational in Computer Programming", certifications: "AWS Certified Developer, Coursera Machine Learning Specialization, Oracle Certified Java Programmer", recognition: "Innovation Award", label: "BSCS" },
  { job_title: "Information Systems Manager", industry: "corporate enterprise", skills: "information security management, cloud ERP solutions, collaboration, data analysis, dashboard creation", duties: "implement ITIL processes for service management and incident resolution; gather and document business requirements from stakeholders across departments; develop data migration strategies for system upgrade projects; conduct IT audits to ensure compliance with regulatory standards and policies; communicate with clients and stakeholders across the organization", educational_background: "Technical-Vocational in Bookkeeping and Accounting", certifications: "Oracle Database SQL Certified, Certified Information Systems Auditor", recognition: "Innovation Award", label: "BSIS" },
  { job_title: "Systems Programmer", industry: "cloud computing provider", skills: "data structures, decision making, SQL databases, computational complexity analysis, computer architecture, ETL processes, Git version control", duties: "lead technical design discussions and architecture reviews; optimize application performance through profiling and benchmarking; design database schemas and optimize query performance", educational_background: "ALS Certification with programming background", certifications: "Meta Backend Developer Certificate", recognition: "Safety Compliance Award", label: "BSCS" },
  { job_title: "Data Center Technician", industry: "managed service provider", skills: "customer service, cloud computing platforms, Office 365 administration, Active Directory management, firewall configuration, critical thinking, time management", duties: "attend team meetings and provide regular status updates; maintain service level agreements and track incident resolution metrics; develop and maintain websites using modern web technologies; create PowerShell and Bash scripts to automate routine IT tasks", educational_background: "Some College units in Information Technology", certifications: "Microsoft 365 Certified Administrator", recognition: "Outstanding Performance Award", label: "BSIT" },
  { job_title: "Supply Planning Manager", industry: "logistics and trucking company", skills: "hazardous materials handling, RFP and RFQ process, just-in-time delivery, professionalism, cycle counting procedures, supplier performance evaluation, freight management, economic order quantity, organizational skills", duties: "monitor and manage transportation routes for cost and time efficiency; manage warehouse operations including receiving storage and distribution; manage import and export documentation including bills of lading and customs forms; develop demand forecasting models to support supply planning decisions", educational_background: "Technical-Vocational in Warehousing", certifications: "Certified in Logistics Transportation and Distribution, Forklift Operation TESDA NCII, Customs Broker Licensure Exam Passer", recognition: "Customer Service Excellence Award", label: "BSBA-LSCM" },
  { job_title: "Accounts Receivable Specialist", industry: "mutual fund company", skills: "merger and acquisition analysis, capital budgeting, budgeting and forecasting, time management, accounting principles GAAP, Xero accounting software, creativity", duties: "develop revenue forecasting models based on historical data and trends; manage treasury operations including cash flow forecasting and bank relationships; monitor foreign exchange exposure and implement hedging strategies", educational_background: "Technical-Vocational in Accounting Technology", certifications: "Insurance Certification, Certified Management Accountant", recognition: "Customer Service Excellence Award", label: "BSBA-FM" },
  { job_title: "Trade Compliance Officer", industry: "automotive parts distribution", skills: "communication skills, Power BI dashboards, lean supply chain principles, SAP Materials Management, packaging standards, critical thinking, time management", duties: "manage import and export documentation including bills of lading and customs forms; implement warehouse management systems for accurate inventory tracking; conduct ABC analysis to categorize inventory by value and turnover; plan and execute distribution center layout for maximum efficiency; attend team meetings and provide regular status updates", educational_background: "Some College units in Logistics Management", certifications: "Customs Broker Licensure Exam Passer, Warehouse Management Certification", recognition: "Sales Achievement Award", label: "BSBA-LSCM" },
  { job_title: "Procurement Specialist", industry: "shipping line", skills: "hazardous materials handling, import and export procedures, supply chain analytics, transportation management, lean supply chain principles, last mile delivery coordination, Filipino language proficiency, load planning, LTL and FTL shipping", duties: "manage fleet operations including vehicle maintenance and driver scheduling; implement warehouse management systems for accurate inventory tracking; provide quality service to internal and external clients", educational_background: "High School Graduate with logistics experience", certifications: "Dangerous Goods Handling Certificate", recognition: "Community Service Citation", label: "BSBA-LSCM" },
  { job_title: "Cloud Migration Specialist", industry: "banking IT department", skills: "public speaking, Docker basics, backup and recovery solutions, Windows Server administration, VMware virtualization, penetration testing, ITIL service management, endpoint protection", duties: "set up and manage virtualization platforms including VMware and Hyper-V; participate in professional development and training seminars; configure VPN connections for remote access and branch office connectivity; install and configure hardware components including servers and storage", educational_background: "Some College units in Information Systems", certifications: "Microsoft Certified Azure Administrator, Certified Ethical Hacker, Red Hat Certified System Administrator", recognition: "Customer Service Excellence Award", label: "BSIT" },
  { job_title: "Freight Coordinator", industry: "FMCG distribution company", skills: "cycle counting procedures, TMS transportation management systems, customs regulations compliance, adaptability, transportation management, report writing, just-in-time delivery, vendor management and evaluation, RFP and RFQ process", duties: "coordinate with production planning to align supply with demand schedules; manage fleet operations including vehicle maintenance and driver scheduling; conduct ABC analysis to categorize inventory by value and turnover; develop contingency plans for supply chain disruptions and risk events", educational_background: "ALS Certification with supply chain work background", certifications: "ISO 28000 Supply Chain Security, Forklift Operation TESDA NCII", recognition: "Customer Service Excellence Award", label: "BSBA-LSCM" },
  { job_title: "Media Buyer", industry: "pharmaceutical marketing", skills: "lead generation, leadership, social media marketing, loyalty program management, visual merchandising, organizational skills, Instagram marketing, creativity", duties: "mentor and train new employees in department procedures; manage email marketing campaigns including segmentation and automation; manage visual merchandising and in-store promotional displays; manage marketing budget allocation across channels and campaigns", educational_background: "Associate in Business Management", certifications: "Public Relations Certificate", recognition: "Safety Compliance Award", label: "BSBA-MM" },
  { job_title: "HR Assistant", industry: "government human resources office", skills: "resume screening, attention to detail, payroll processing, employee engagement strategies, Microsoft Office proficiency, job posting and advertising, turnover analysis, job description writing", duties: "manage labor relations including collective bargaining and union interactions; maintain HRIS records and generate workforce analytics reports; ensure compliance with labor laws and employment regulations", educational_background: "Technical-Vocational in Administrative Support", certifications: "HR Management Certificate TESDA, Certified Payroll Professional, Certified Compensation Professional", recognition: "Customer Service Excellence Award", label: "BSBA-HRM" },
  { job_title: "Computer Vision Engineer", industry: "gaming studio", skills: "computational complexity analysis, multithreading, agile methodology, Filipino language proficiency, microservices architecture, unit testing", duties: "follow company policies and standard operating procedures; build machine learning models for predictive analytics and pattern recognition; optimize application performance through profiling and benchmarking", educational_background: "Some College units in Mathematics", certifications: "Oracle Certified Java Programmer, Python Institute PCEP/PCAP", recognition: "Best Team Player Award", label: "BSCS" },
  { job_title: "Inventory Control Specialist", industry: "retail distribution center", skills: "problem solving, analytical thinking, fleet management operations, reverse logistics processes, ABC inventory analysis, cycle counting procedures", duties: "participate in professional development and training seminars; conduct cycle counts and reconcile inventory discrepancies; implement warehouse management systems for accurate inventory tracking; manage load planning and container utilization for shipping efficiency; coordinate with production planning to align supply with demand schedules", educational_background: "Some College units in International Trade", certifications: "APICS CPIM Certification, ISO 28000 Supply Chain Security, Lean Supply Chain Certification", recognition: "Best Team Player Award", label: "BSBA-LSCM" },
  { job_title: "IT Procurement Specialist", industry: "data center operations", skills: "patch management, leadership, database administration, DNS and DHCP management, conflict resolution, HTML CSS and JavaScript, CCNA routing and switching, Docker basics, time management", duties: "manage mobile device policies and MDM platform configuration; set up and maintain web servers including Apache and Nginx", educational_background: "Some College units in Information Systems", certifications: "Cisco CCNA", recognition: "Outstanding Performance Award", label: "BSIT" },
  { job_title: "Operations Research Analyst", industry: "electronics assembly plant", skills: "poka-yoke mistake proofing, Kaizen continuous improvement, 5S workplace organization, workplace safety management, Arena simulation software, root cause analysis, Filipino language proficiency", duties: "establish safety protocols and ensure compliance with OSHA regulations; mentor and train new employees in department procedures; analyze production processes and identify bottlenecks to improve efficiency; conduct value stream mapping to visualize and improve process flows", educational_background: "High School Graduate with factory experience", certifications: "Certified Industrial Engineer", recognition: "Outstanding Performance Award", label: "BSIE" },
  { job_title: "Signal Processing Engineer", industry: "electronics manufacturing", skills: "decision making, FPGA programming, IoT protocols MQTT Zigbee BLE, collaboration, English language proficiency, reliability testing, STM32 microcontroller, CAN bus protocol, KiCad PCB design", duties: "mentor and train new employees in department procedures; write firmware for microcontrollers using C and assembly language; design and prototype wearable technology devices", educational_background: "High School Graduate with electronics training", certifications: "Altium Designer Certification, Cisco IoT Certification", recognition: "Customer Service Excellence Award", label: "BSCpE" },
  { job_title: "Transportation Planner", industry: "e-commerce fulfillment center", skills: "incoterms knowledge, RFP and RFQ process, WMS warehouse management systems, decision making, vendor management and evaluation, creativity", duties: "conduct cycle counts and reconcile inventory discrepancies; ensure compliance with customs regulations for international shipments; manage reverse logistics processes for returns and defective products", educational_background: "Some College units in Business Administration", certifications: "Certified Supply Chain Professional CSCP, Dangerous Goods Handling Certificate, Customs Broker Licensure Exam Passer", recognition: "Safety Compliance Award", label: "BSBA-LSCM" },
  { job_title: "Business Systems Coordinator", industry: "audit and advisory firm", skills: "system integration, database management, creativity, stakeholder management, enterprise architecture", duties: "manage IT project timelines budgets and resource allocation; gather and document business requirements from stakeholders across departments; conduct IT audits to ensure compliance with regulatory standards and policies; participate in professional development and training seminars; design automated workflows for approval processes and notifications", educational_background: "Some College units in Accountancy", certifications: "Tableau Desktop Specialist, Microsoft Certified Data Analyst Associate", recognition: "Customer Service Excellence Award", label: "BSIS" },
];

// ═══════════════════════════════════════════════════════════
// SECTION 10: PUBLIC API (backward-compatible)
// ═══════════════════════════════════════════════════════════

/**
 * Backward-compatible API for degree recommendation.
 * Called from app/appform/c-h.tsx with (jobTitle, skills, duties).
 * Internally uses Random Forest prediction.
 */
export function getRecommendedDegree(jobTitle: string, skills: string, duties: string) {
  const input: ApplicantInput = {
    jobTitle,
    industry: '',
    skills,
    duties,
    educationalBackground: '',
    certifications: '',
    recognition: '',
  };

  return predictWithReasons(input);
}

/**
 * Extended API accepting all 7 fields for richer prediction.
 * Can be used from new UI components that collect more data.
 */
export function getRecommendedDegreeExtended(input: ApplicantInput) {
  return predictWithReasons(input);
}

function predictWithReasons(input: ApplicantInput): PredictionResult[] {
  const model = getOrTrainModel();
  const votes = model.predict(extractFeatures(input));
  const totalVotes = Object.values(votes).reduce((s, v) => s + v, 0) || 1;

const CONFIDENCE_THRESHOLD = 10; // Minimum % to be shown at all

function getMatchLabel(confidence: number): PredictionResult['matchLabel'] {
  if (confidence >= 40) return 'Strong Match';
  if (confidence >= 20) return 'Good Match';
  return 'Possible Match';
}

const results: PredictionResult[] = Object.entries(votes).map(([id, count]) => {
  const confidence = Math.round((count / totalVotes) * 100);
  return {
    id,
    name: DEGREE_NAMES[id as DegreeId] || id,
    score: count,
    confidence,
    matchLabel: getMatchLabel(confidence),
    reasons: generateReasons(input, id as DegreeId),
  };
});

results.sort((a, b) => b.score - a.score);
return results.filter(r => r.confidence >= CONFIDENCE_THRESHOLD).slice(0, 3);
}