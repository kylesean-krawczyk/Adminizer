export interface ParsedDocumentQuery {
  keywords: string[];
  documentType?: string;
  category?: string;
  department?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  tags?: string[];
  author?: string;
  fiscalPeriod?: {
    year?: string;
    quarter?: string;
  };
  confidence: number;
  originalQuery: string;
}

export interface QueryParserResult {
  parsed: ParsedDocumentQuery;
  suggestedAlternatives?: string[];
  needsClarification: boolean;
  clarificationQuestions?: string[];
}

export class DocumentQueryParser {
  private static readonly DOCUMENT_TYPES = [
    'invoice',
    'contract',
    'report',
    'policy',
    'handbook',
    'manual',
    'guideline',
    'presentation',
    'spreadsheet',
    'form',
    'checklist',
    'certificate',
    'agreement',
    'memo',
    'letter',
    'proposal',
    'budget',
    'forecast',
    'statement',
    'schedule',
    'calendar',
    'plan',
    'strategy',
    'analysis',
    'summary',
    'minutes',
    'agenda',
    'other'
  ];

  private static readonly CATEGORIES = [
    'HR',
    'Accounting',
    'Branding',
    'Social Media',
    'Communications',
    'Volunteer/People Management',
    'Streaming: Video & Podcast',
    'Reports',
    'Governance',
    'Legal',
    'Funding',
    'Financial',
    'Operations',
    'Other'
  ];

  private static readonly DEPARTMENTS = [
    'Finance',
    'Human Resources',
    'Marketing',
    'Sales',
    'Operations',
    'IT',
    'Legal',
    'Administration',
    'Executive',
    'Customer Service',
    'Product',
    'Engineering'
  ];

  private static readonly MONTH_PATTERNS: Record<string, number> = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12
  };

  static async parseQuery(query: string): Promise<QueryParserResult> {
    const normalizedQuery = query.toLowerCase().trim();
    const parsed: ParsedDocumentQuery = {
      keywords: [],
      confidence: 0.5,
      originalQuery: query
    };

    parsed.documentType = this.extractDocumentType(normalizedQuery);
    parsed.category = this.extractCategory(normalizedQuery);
    parsed.department = this.extractDepartment(normalizedQuery);
    parsed.dateRange = this.extractDateRange(normalizedQuery);
    parsed.fiscalPeriod = this.extractFiscalPeriod(normalizedQuery);
    parsed.author = this.extractAuthor(normalizedQuery);
    parsed.tags = this.extractTags(normalizedQuery);
    parsed.keywords = this.extractKeywords(normalizedQuery, parsed);

    parsed.confidence = this.calculateConfidence(parsed);

    const needsClarification = parsed.confidence < 0.6 || parsed.keywords.length === 0;
    const clarificationQuestions = needsClarification
      ? this.generateClarificationQuestions(parsed)
      : undefined;

    const suggestedAlternatives = this.generateAlternatives(parsed);

    return {
      parsed,
      suggestedAlternatives,
      needsClarification,
      clarificationQuestions
    };
  }

  private static extractDocumentType(query: string): string | undefined {
    for (const type of this.DOCUMENT_TYPES) {
      if (query.includes(type)) {
        return type;
      }
    }

    const typePatterns: Record<string, string> = {
      'financial report': 'report',
      'sales report': 'report',
      'quarterly report': 'report',
      'annual report': 'report',
      'employee handbook': 'handbook',
      'brand guidelines': 'guideline',
      'style guide': 'guideline',
      'service agreement': 'agreement',
      'work contract': 'contract',
      'nda': 'agreement',
      'compliance checklist': 'checklist',
      'budget spreadsheet': 'spreadsheet',
      'excel': 'spreadsheet',
      'powerpoint': 'presentation',
      'slides': 'presentation',
      'pdf': 'report',
      'document': 'other'
    };

    for (const [pattern, type] of Object.entries(typePatterns)) {
      if (query.includes(pattern)) {
        return type;
      }
    }

    return undefined;
  }

  private static extractCategory(query: string): string | undefined {
    for (const category of this.CATEGORIES) {
      if (query.includes(category.toLowerCase())) {
        return category;
      }
    }

    const categoryPatterns: Record<string, string> = {
      'human resources': 'HR',
      'finance': 'Financial',
      'accounting': 'Accounting',
      'marketing': 'Branding',
      'social': 'Social Media',
      'legal': 'Legal',
      'compliance': 'Legal',
      'operational': 'Operations',
      'governance': 'Governance',
      'funding': 'Funding',
      'grant': 'Funding',
      'donation': 'Funding'
    };

    for (const [pattern, category] of Object.entries(categoryPatterns)) {
      if (query.includes(pattern)) {
        return category;
      }
    }

    return undefined;
  }

  private static extractDepartment(query: string): string | undefined {
    for (const dept of this.DEPARTMENTS) {
      if (query.includes(dept.toLowerCase())) {
        return dept;
      }
    }

    const deptPatterns: Record<string, string> = {
      'hr': 'Human Resources',
      'it': 'IT',
      'tech': 'IT',
      'sales': 'Sales',
      'marketing': 'Marketing',
      'finance': 'Finance',
      'legal': 'Legal',
      'ops': 'Operations'
    };

    for (const [pattern, dept] of Object.entries(deptPatterns)) {
      if (query.includes(pattern)) {
        return dept;
      }
    }

    return undefined;
  }

  private static extractDateRange(query: string): { startDate?: string; endDate?: string } | undefined {
    const dateRange: { startDate?: string; endDate?: string } = {};
    const now = new Date();
    const currentYear = now.getFullYear();

    if (query.includes('last month')) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      dateRange.startDate = lastMonth.toISOString().split('T')[0];
      dateRange.endDate = lastMonthEnd.toISOString().split('T')[0];
    } else if (query.includes('this month')) {
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateRange.startDate = thisMonthStart.toISOString().split('T')[0];
      dateRange.endDate = now.toISOString().split('T')[0];
    } else if (query.includes('last year')) {
      dateRange.startDate = `${currentYear - 1}-01-01`;
      dateRange.endDate = `${currentYear - 1}-12-31`;
    } else if (query.includes('this year')) {
      dateRange.startDate = `${currentYear}-01-01`;
      dateRange.endDate = now.toISOString().split('T')[0];
    } else if (query.includes('last week')) {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateRange.startDate = lastWeek.toISOString().split('T')[0];
      dateRange.endDate = now.toISOString().split('T')[0];
    }

    for (const [monthName, monthNum] of Object.entries(this.MONTH_PATTERNS)) {
      if (query.includes(monthName)) {
        const yearMatch = query.match(new RegExp(`${monthName}\\s+(\\d{4})`));
        const year = yearMatch ? parseInt(yearMatch[1]) : currentYear;
        const monthStart = new Date(year, monthNum - 1, 1);
        const monthEnd = new Date(year, monthNum, 0);
        dateRange.startDate = monthStart.toISOString().split('T')[0];
        dateRange.endDate = monthEnd.toISOString().split('T')[0];
        break;
      }
    }

    const yearMatch = query.match(/\b(20\d{2})\b/);
    if (yearMatch && !dateRange.startDate) {
      const year = yearMatch[1];
      dateRange.startDate = `${year}-01-01`;
      dateRange.endDate = `${year}-12-31`;
    }

    const dateFormatMatch = query.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (dateFormatMatch) {
      dateRange.startDate = dateFormatMatch[0];
    }

    return Object.keys(dateRange).length > 0 ? dateRange : undefined;
  }

  private static extractFiscalPeriod(query: string): { year?: string; quarter?: string } | undefined {
    const fiscalPeriod: { year?: string; quarter?: string } = {};

    const quarterMatch = query.match(/\b(q[1-4]|quarter\s*[1-4]|[1-4]st\s*quarter|[1-4]nd\s*quarter|[1-4]rd\s*quarter|[1-4]th\s*quarter)\b/i);
    if (quarterMatch) {
      const quarterNum = quarterMatch[0].match(/[1-4]/)?.[0];
      if (quarterNum) {
        fiscalPeriod.quarter = `Q${quarterNum}`;
      }
    }

    const fyMatch = query.match(/\b(fy|fiscal\s*year)\s*(20\d{2}|'\d{2}|\d{2})\b/i);
    if (fyMatch) {
      let year = fyMatch[2];
      if (year.startsWith("'")) {
        year = '20' + year.substring(1);
      } else if (year.length === 2) {
        year = '20' + year;
      }
      fiscalPeriod.year = year;
    }

    return Object.keys(fiscalPeriod).length > 0 ? fiscalPeriod : undefined;
  }

  private static extractAuthor(query: string): string | undefined {
    const authorPatterns = [
      /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /author[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /created\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
    ];

    for (const pattern of authorPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private static extractTags(query: string): string[] | undefined {
    const tags: string[] = [];

    const tagPattern = /#(\w+)/g;
    let match;
    while ((match = tagPattern.exec(query)) !== null) {
      tags.push(match[1]);
    }

    const commonTags = [
      'urgent', 'important', 'draft', 'final', 'approved', 'pending',
      'confidential', 'public', 'internal', 'external', 'archived'
    ];

    for (const tag of commonTags) {
      if (query.includes(tag) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags.length > 0 ? tags : undefined;
  }

  private static extractKeywords(query: string, parsed: ParsedDocumentQuery): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'find', 'search', 'show', 'get', 'give', 'document', 'file', 'documents',
      'files', 'need', 'want', 'looking', 'look', 'can', 'you', 'please',
      'me', 'my', 'i', 'we', 'our', 'is', 'are', 'was', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'that', 'this', 'these',
      'those', 'where', 'when', 'how', 'what', 'which', 'who', 'whom'
    ]);

    const excludeTerms: string[] = [];

    if (parsed.documentType) excludeTerms.push(parsed.documentType);
    if (parsed.category) excludeTerms.push(parsed.category.toLowerCase());
    if (parsed.department) excludeTerms.push(parsed.department.toLowerCase());
    if (parsed.author) excludeTerms.push(...parsed.author.toLowerCase().split(' '));

    const words = query
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !stopWords.has(word))
      .filter(word => !excludeTerms.includes(word));

    return [...new Set(words)];
  }

  private static calculateConfidence(parsed: ParsedDocumentQuery): number {
    let confidence = 0;

    if (parsed.keywords.length > 0) confidence += 0.3;
    if (parsed.keywords.length > 2) confidence += 0.1;

    if (parsed.documentType) confidence += 0.2;
    if (parsed.category) confidence += 0.15;
    if (parsed.department) confidence += 0.1;
    if (parsed.dateRange) confidence += 0.1;
    if (parsed.fiscalPeriod) confidence += 0.1;
    if (parsed.author) confidence += 0.1;
    if (parsed.tags && parsed.tags.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private static generateClarificationQuestions(parsed: ParsedDocumentQuery): string[] {
    const questions: string[] = [];

    if (!parsed.documentType && parsed.keywords.length > 0) {
      questions.push('What type of document are you looking for? (e.g., report, contract, invoice)');
    }

    if (!parsed.dateRange && !parsed.fiscalPeriod) {
      questions.push('What time period should I search in? (e.g., this month, Q3 2024, last year)');
    }

    if (!parsed.category && !parsed.department) {
      questions.push('Which department or category? (e.g., HR, Finance, Marketing)');
    }

    if (parsed.keywords.length === 0) {
      questions.push('Can you describe what the document is about or what it contains?');
    }

    return questions;
  }

  private static generateAlternatives(parsed: ParsedDocumentQuery): string[] {
    const alternatives: string[] = [];

    if (parsed.documentType) {
      alternatives.push(`All ${parsed.documentType}s`);
    }

    if (parsed.category) {
      alternatives.push(`Recent ${parsed.category} documents`);
    }

    if (parsed.dateRange) {
      alternatives.push('Documents from other time periods');
    }

    if (parsed.keywords.length > 0) {
      const primaryKeyword = parsed.keywords[0];
      alternatives.push(`Documents tagged with "${primaryKeyword}"`);
      alternatives.push(`Documents mentioning "${primaryKeyword}"`);
    }

    if (parsed.fiscalPeriod) {
      alternatives.push('Other fiscal periods');
    }

    return alternatives.slice(0, 3);
  }

  static async parseWithAI(
    query: string,
    _conversationContext?: string
  ): Promise<ParsedDocumentQuery> {
    const basicParse = await this.parseQuery(query);
    return basicParse.parsed;
  }
}
