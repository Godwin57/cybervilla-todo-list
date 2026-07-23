export default {
  migrations: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
};
