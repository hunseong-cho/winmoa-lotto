const path = require("path");

module.exports = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ 빌드 시 ESLint 오류 무시
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  }
};
