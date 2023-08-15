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
	let responseObj: any
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

	let searchConfig = {
		method: 'post',
		url: `${process.env.API_ROOT_URL}games`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: `search "${searchterm}"; fields id,age_ratings,artworks,category,cover,first_release_date,external_games,follows,game_modes,genres,hypes,
		involved_companies,keywords,name,platforms,player_perspectives,total_rating,total_rating_count,screenshots,similar_games,slug,storyline,summary,tags,themes,
		url,videos,websites,language_supports,game_localizations; limit 1;`
		}
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data[0]
		responseObj = {
			id: searchResults.id,
			age_ratings: searchResults.age_ratings.join(','),
			artworks: searchResults.artworks.join(','),
			external_games: searchResults.external_games.join(','),
			game_modes: searchResults.game_modes.join(','),
			genres: searchResults.genres.join(','),
			hypes: searchResults.hypes,
			involved_companies: searchResults.involved_companies.join(','),
			keywords: searchResults.keywords.join(','),
			platforms: searchResults.platforms.join(','),
			player_perspectives: searchResults.player_perspectives.join(','),
			screenshots: searchResults.screenshots.join(','),
			similar_games: searchResults.similar_games.join(','),
			tags: searchResults.tags.join(','),
			themes: searchResults.themes.join(','),
			videos: searchResults.videos.join(','),
			websites: searchResults.websites.join(','),
			language_supports: searchResults.language_supports.join(','),
			game_localizations: searchResults.game_localizations.join(','),
			rating: searchResults.total_rating,
			ratingCount: searchResults.total_rating_count,
			releaseDate: new Date(searchResults.first_release_date),
			likes: searchResults.follows,
			title: searchResults.name,
			story: searchResults.storyline,
			summary: searchResults.summary,
			url: searchResults.url
		}
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
	searchConfig.url=`${process.env.API_ROOT_URL}age_ratings`
	searchConfig.data=`fields category, rating; where id=(${responseObj.age_ratings}) & category=(1,2);`
	//change to use enum
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		responseObj.age_ratings = {
			'ESRB': response.data[0].rating,
			'PEGI': response.data[1].rating,
		}
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}artworks`
	searchConfig.data=`fields url; where id=(${responseObj.artworks});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfImages: string[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfImages.push(searchResults[i].url)
		}
		responseObj.artworks = arrOfImages
		
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	
	return response.status(200).json(responseObj)
})


const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})