import { Pool } from 'pg'
// const pool = new Pool({
// 	host: 'db',
// 	port: 5432,
// 	user: 'user123',
// 	password: 'password123',
// 	database: 'db123'
// })
const pool = new Pool({
	host: 'db',
	user: 'docker',
	password: '1234',
	database: 'docker'
})

export { pool }