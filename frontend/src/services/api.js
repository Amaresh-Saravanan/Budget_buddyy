import axios from "axios";

//
// 🧪 MOCK MODE FLAG
// Toggle using frontend/.env → VITE_MOCK_MODE=true
//
const MOCK =
  import.meta.env.VITE_MOCK_MODE ===
  "true";

//
// 🌐 AXIOS INSTANCE
//
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

//
// 🧪 MOCK RESPONSES
// Add more endpoints anytime
//
const mockResponses = {
  //
  // 🔥 SAVINGS STREAK
  //
  "/gamification/streak": {
    streak: 9,
    achievement: {
      title: "Thrifty Ninja",
      icon: "🥷",
    },
  },

  //
  // 🎉 NO SPEND DAY
  //
  "/gamification/no-spend": {
    noSpend: true,
  },

  //
  // 📅 WEEKLY PROGRESS
  //
  "/gamification/weekly-progress": {
    percent: 67,
    remaining: 1160,
    perDay: 290,
    status: "On Track",
  },

  //
  // 📊 WEEKLY PULSE
  //
  "/analytics/weekly-pulse": {
    spent: 2340,
    saved: 680,
    comparison: 12,
    categoryBreakdown: [
      { category: "Food", amount: 1053 },
      { category: "Transport", amount: 585 },
      { category: "Fun", amount: 468 },
      { category: "Bills", amount: 117 },
      { category: "Others", amount: 117 },
    ],
  },

  //
  // 📈 MONTHLY TRENDS
  //
  "/analytics/monthly-trends": [
    { month: "Dec", total: 5600 },
    { month: "Jan", total: 4800 },
    { month: "Feb", total: 4200 },
  ],
};

//
// 🔁 MOCK INTERCEPTOR
// Intercepts requests → returns fake data
//
if (MOCK) {
  API.interceptors.request.use(
    async (config) => {
      console.log(
        "🧪 MOCK API:",
        config.url
      );

      config.adapter = async () => {
        return {
          data:
            mockResponses[
              config.url
            ] || {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      return config;
    }
  );
}

//
// 🔐 OPTIONAL AUTH TOKEN SUPPORT
// (safe even if token missing)
//
API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

//
// ✅ DEFAULT EXPORT (FIXES YOUR ERROR)
//
export default API;
