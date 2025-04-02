/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://dhlottery.winmoa.net/',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  outDir: "public",
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"]
      }
    ],
    additionalSitemaps: [
      "https://dhlottery.winmoa.net/sitemap.xml"
    ]
  }
};
