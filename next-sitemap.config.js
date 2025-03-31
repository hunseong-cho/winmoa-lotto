/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://lotto.winmoa.net',
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
      "https://lotto.winmoa.net/sitemap.xml"
    ]
  }
};
