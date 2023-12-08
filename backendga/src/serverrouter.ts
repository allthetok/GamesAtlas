/* eslint-disable @typescript-eslint/no-var-requires */
import { requestLogger, corsOptions } from '../helpers/requests'
require('dotenv').config()
import express, {  } from 'express'
import cors from 'cors'
import { router as deprecatedRouter } from '../routes/deprecated'
import { router as gameRouter } from '../routes/game'
import { router as tableRouter } from '../routes/db'
import { router as userRouter } from '../routes/user'

const app = express()
app.use(express.json())
app.use(requestLogger)
app.use(cors(corsOptions))
app.use('/api/deprecated', deprecatedRouter)
app.use('/api/game', gameRouter)
app.use('/api/table', tableRouter)
app.use('/api/user', userRouter)

const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})