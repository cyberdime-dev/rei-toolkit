/*
 * REI Toolkit - Community Core
 * License: AGPL-3.0-only
 * See LICENSES.md and licensing/feature-map.json
 */
// News Management Utility for Real Estate Market Updates
// Handles news data with localStorage caching and mock API simulation

const STORAGE_KEY = 'rei_toolkit_news_cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export class NewsArticle {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.title = data.title || ''
    this.summary = data.summary || ''
    this.content = data.content || ''
    this.category = data.category || 'market-update'
    this.source = data.source || 'REI Toolkit'
    this.author = data.author || 'Editorial Team'
    this.publishedAt = data.publishedAt || new Date().toISOString()
    this.imageUrl = data.imageUrl || ''
    this.url = data.url || ''
    this.tags = data.tags || []
    this.readTime = data.readTime || this.calculateReadTime()
    this.trending = data.trending || false
    this.featured = data.featured || false
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  calculateReadTime() {
    const wordsPerMinute = 200
    const wordCount = this.content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  get formattedDate() {
    return new Date(this.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  get timeAgo() {
    const now = new Date()
    const published = new Date(this.publishedAt)
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`
    
    return this.formattedDate
  }
}

export class NewsManager {
  constructor() {
    this.articles = []
    this.categories = [
      { value: 'market-update', title: 'Market Updates', icon: 'mdi-chart-line' },
      { value: 'interest-rates', title: 'Interest Rates', icon: 'mdi-percent' },
      { value: 'legislation', title: 'Legislation', icon: 'mdi-gavel' },
      { value: 'tips-strategies', title: 'Tips & Strategies', icon: 'mdi-lightbulb' },
      { value: 'technology', title: 'PropTech', icon: 'mdi-laptop' },
      { value: 'local-news', title: 'Local Markets', icon: 'mdi-map-marker' },
    ]
    this.loadArticles()
  }

  // Load articles from cache or generate mock data
  loadArticles() {
    const cached = this.loadFromCache()
    if (cached && cached.articles) {
      this.articles = cached.articles.map(data => new NewsArticle(data))
      return
    }

    // Generate mock articles for demo
    this.articles = this.generateMockArticles()
    this.saveToCache()
  }

  loadFromCache() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return null

      const cached = JSON.parse(data)
      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION
      
      return isExpired ? null : cached
    } catch (error) {
      console.error('Error loading news cache:', error)
      return null
    }
  }

  saveToCache() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        articles: this.articles,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error saving news cache:', error)
    }
  }

  generateMockArticles() {
    const mockData = [
      {
        title: 'Federal Reserve Signals Potential Rate Cuts in 2025',
        summary: 'The Fed hints at possible interest rate reductions, potentially boosting real estate investment opportunities.',
        content: `The Federal Reserve has signaled potential interest rate cuts in the coming months, citing cooling inflation and economic indicators. This development could significantly impact real estate investment strategies.

Key highlights from the Fed's announcement:
• Inflation showing consistent downward trend
• Employment data supporting economic stability  
• Housing market showing signs of recovery
• Commercial real estate sentiment improving

For real estate investors, this could mean:
- Lower borrowing costs for acquisitions
- Improved cash flow on leveraged properties
- Increased competition for quality deals
- Potential for property value appreciation

Market analysts suggest investors should prepare for increased activity in both residential and commercial sectors. Consider locking in current rates if planning acquisitions, as demand may drive rates higher even if Fed rates decrease.`,
        category: 'interest-rates',
        author: 'Sarah Mitchell',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        tags: ['federal-reserve', 'interest-rates', 'market-outlook'],
        trending: true,
        featured: true,
      },
      {
        title: 'New Tax Incentives for Affordable Housing Investments',
        summary: 'Congress passes legislation offering enhanced tax benefits for investors in affordable housing projects.',
        content: `New federal legislation introduces enhanced tax incentives for investors participating in affordable housing development, potentially reshaping investment strategies across the country.

The key provisions include:
• Enhanced 1031 exchange benefits for affordable housing
• Increased depreciation schedules for qualifying properties
• New opportunity zone extensions
• Tax credit enhancements for low-income housing

Investment opportunities:
- Build-to-rent communities in underserved areas
- Conversion of commercial properties to affordable housing
- Public-private partnership projects
- Preservation of existing affordable housing stock

Financial impact analysis shows potential IRR improvements of 2-4% for qualifying projects. Investors should consult with tax professionals to understand eligibility requirements and optimize their investment structures.`,
        category: 'legislation',
        author: 'Michael Rodriguez',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        tags: ['tax-incentives', 'affordable-housing', 'legislation'],
        trending: true,
      },
      {
        title: 'AI-Powered Property Valuation Tools Show 95% Accuracy',
        summary: 'New artificial intelligence models are revolutionizing property valuation with unprecedented accuracy rates.',
        content: `Revolutionary AI-powered property valuation tools are achieving 95% accuracy rates, transforming how investors analyze potential acquisitions and portfolio management.

Technology breakthroughs include:
• Machine learning models analyzing 500+ property factors
• Real-time market data integration
• Predictive analytics for future value trends
• Automated comparable sales analysis

Benefits for investors:
- Faster due diligence processes
- More accurate ARV estimates for fix-and-flip projects
- Better rental rate projections
- Enhanced portfolio optimization

Early adopters report 30% faster deal analysis and improved investment decisions. Several major REI platforms are integrating these tools, making sophisticated analysis accessible to individual investors.`,
        category: 'technology',
        author: 'Dr. Emily Chen',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        tags: ['artificial-intelligence', 'property-valuation', 'technology'],
        trending: false,
      },
      {
        title: 'Short-Term Rental Regulations: What Investors Need to Know',
        summary: 'Major cities implement new STR regulations affecting investor strategies and compliance requirements.',
        content: `Major metropolitan areas are implementing comprehensive short-term rental regulations, requiring investors to adapt their strategies and ensure compliance.

Recent regulatory changes:
• Registration and licensing requirements
• Occupancy limits and safety standards
• Tax collection and remittance obligations
• Zoning restrictions in residential areas

Impact on investment strategies:
- Due diligence must include regulatory research
- Operating expenses may increase with compliance costs
- Some markets becoming less attractive for STR investment
- Increased focus on mid-term rental strategies

Best practices for compliance:
1. Research local regulations before acquisition
2. Budget for licensing and compliance costs
3. Consider professional property management
4. Monitor regulatory changes in your markets

Investors should review their existing STR portfolios and ensure full compliance to avoid penalties and operational disruptions.`,
        category: 'legislation',
        author: 'Amanda Foster',
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
        tags: ['short-term-rentals', 'regulations', 'compliance'],
      },
      {
        title: 'Build-to-Rent Sector Attracts $50B in Investment',
        summary: 'Institutional investors pour billions into build-to-rent communities, signaling major market shift.',
        content: `The build-to-rent sector has attracted over $50 billion in institutional investment this year, marking a significant shift in real estate investment patterns and creating new opportunities for individual investors.

Market dynamics:
• 35% increase in BTR development projects
• Average yields exceeding traditional rentals by 1-2%
• Institutional partnerships with local developers
• Focus on suburban and secondary markets

Opportunities for individual investors:
- Joint ventures with institutional partners
- Investment in BTR-focused REITs
- Development of smaller BTR communities
- Service provider opportunities (property management, construction)

Geographic trends show strongest growth in:
1. Texas and Florida markets
2. Suburban markets with good school districts
3. Areas with limited single-family inventory
4. Markets with strong job growth

This trend suggests a fundamental shift toward rental housing, creating long-term opportunities for prepared investors.`,
        category: 'market-update',
        author: 'James Thompson',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        tags: ['build-to-rent', 'institutional-investment', 'market-trends'],
      },
      {
        title: '5 Advanced BRRR Strategies for 2025',
        summary: 'Expert insights on optimizing the BRRR method with new financing options and market conditions.',
        content: `As market conditions evolve, successful BRRR investors are adapting their strategies to maximize returns and minimize risk in 2025.

Advanced BRRR strategies:

1. **Cross-Collateralization BRRR**
   - Use multiple properties as collateral
   - Access larger credit lines
   - Reduce per-property lending costs

2. **Commercial-to-Residential Conversion**
   - Target undervalued commercial properties
   - Convert to multi-family rentals
   - Capitalize on zoning changes

3. **Technology-Enhanced Renovations**
   - Smart home integrations increase ARV
   - Energy-efficient upgrades command premium rents
   - Use project management software for efficiency

4. **Partnership BRRR Models**
   - Joint ventures with contractors
   - Investor partnerships for larger projects
   - Shared risk and expertise

5. **Market Timing BRRR**
   - Seasonal acquisition strategies
   - Interest rate cycle optimization
   - Local market condition analysis

Implementation tips:
• Build relationships with portfolio lenders
• Maintain 6+ months of reserves
• Focus on markets with strong rental demand
• Document all improvements for appraisals

Success in BRRR requires adaptation to changing market conditions and continuous education on new strategies and regulations.`,
        category: 'tips-strategies',
        author: 'Brandon Turner',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        tags: ['brrr', 'strategies', 'advanced-techniques'],
        featured: true,
      },
    ]

    return mockData.map(data => new NewsArticle(data))
  }

  // Get all articles
  getAllArticles() {
    return [...this.articles]
  }

  // Get articles by category
  getArticlesByCategory(category) {
    if (!category) return this.getAllArticles()
    return this.articles.filter(article => article.category === category)
  }

  // Get featured articles
  getFeaturedArticles() {
    return this.articles.filter(article => article.featured)
  }

  // Get trending articles
  getTrendingArticles() {
    return this.articles.filter(article => article.trending)
  }

  // Search articles
  searchArticles(query) {
    const searchTerm = query.toLowerCase()
    return this.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.summary.toLowerCase().includes(searchTerm) ||
      article.content.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm)),
    )
  }

  // Get article by ID
  getArticleById(id) {
    return this.articles.find(article => article.id === id)
  }

  // Get categories
  getCategories() {
    return [...this.categories]
  }

  // Get category info
  getCategoryInfo(categoryValue) {
    return this.categories.find(cat => cat.value === categoryValue)
  }

  // Refresh articles (simulate API call)
  async refreshArticles() {
    // Simulate API delay
    await new Promise(resolve => window.setTimeout(resolve, 1000))
    
    // In a real implementation, this would fetch from an API
    // For now, just regenerate mock data with some randomization
    this.articles = this.generateMockArticles()
    this.saveToCache()
    
    return this.articles
  }

  // Get summary statistics
  getSummary() {
    const totalArticles = this.articles.length
    const categoryCounts = this.articles.reduce((counts, article) => {
      counts[article.category] = (counts[article.category] || 0) + 1
      return counts
    }, {})

    const recentArticles = this.articles.filter(article => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      return new Date(article.publishedAt).getTime() > oneDayAgo
    }).length

    return {
      totalArticles,
      categoryCounts,
      recentArticles,
      featuredCount: this.getFeaturedArticles().length,
      trendingCount: this.getTrendingArticles().length,
    }
  }
}

// Create singleton instance
export const newsManager = new NewsManager()

export default newsManager
