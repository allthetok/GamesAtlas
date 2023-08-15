/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import axios from 'axios'
import cors from 'cors'
import pg, { QueryResult } from 'pg'
import bcrypt from 'bcrypt'
const app = express()

const corsOptions = {
	origin: 'http://localhost:3000',
	credentials: true,	//access-control-allow-credentials:true
	optionSuccessStatus: 200
}

const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
	console.log('Method:', request.method)
	console.log('Path: ', request.url)
	console.log('Body: ', request.body)
	console.log('---')
	next()
}

app.use(express.json())
app.use(requestLogger)
app.use(cors(corsOptions))

app.post('/api/gamedetails', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	// return response.status(400).json({
	// 	error: 'No search term specified'
	// })
	const searchterm = body.searchterm 
	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}

	const searchConfig = {
		method: 'post',
		url: 'https://api.igdb.com/v4/games',
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: `search "${searchterm}"; fields *;`
		}
	axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		console.log(searchResults)
		console.log(searchResults[0])
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}
	return response.status(200).json(searchResults)
})


const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})