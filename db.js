import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_CONNECTION_STRING + "?sslmode=require");
export default sql; 