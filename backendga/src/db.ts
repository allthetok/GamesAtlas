import { Pool } from 'pg'

const pool = new Pool({
	host: 'db',
	user: 'docker',
	password: process.env.DOCKER_DB_PASS,
	database: 'docker'
})

export { pool }