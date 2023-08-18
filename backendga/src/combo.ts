/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { Language_support_types } from '../helpers/enums'
import { requestLogger, corsOptions, updateIGDBSearchConfig, SearchConfig } from '../helpers/requests'
require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import axios from 'axios'
import cors from 'cors'
import pg, { QueryResult } from 'pg'
import bcrypt from 'bcrypt'
const app = express()

app.use(express.json())
app.use(requestLogger)
app.use(cors(corsOptions))

app.post('/api/gamedetails', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: any
	let errSearch = false
	let searchConfig: SearchConfig
	const searchterm = body.searchterm 
	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}
	// searchConfig = updateIGDBSearchConfig('post', 'games', '')
	searchConfig = {
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
			releaseDate: new Date(searchResults.first_release_date*1000),
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

	searchConfig.url=`${process.env.API_ROOT_URL}external_games`
	searchConfig.data=`fields category, url; where id=(${responseObj.external_games}) & category=(1,5,10,11,13,15,26,31,36);`
	//change to use enum
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfUrls: object[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfUrls.push({
				category: searchResults[i].category,
				url: searchResults[i].url
			})
		}
		responseObj.external_games = arrOfUrls
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}game_modes`
	searchConfig.data=`fields name; where id=(${responseObj.game_modes});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data[0]
		responseObj.game_modes = searchResults.name
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}genres`
	searchConfig.data=`fields name; where id=(${responseObj.genres});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfGenres: string[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfGenres.push(searchResults[i].name)
		}
		responseObj.genres = arrOfGenres
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}involved_companies`
	searchConfig.data=`fields company; where id=(${responseObj.involved_companies});`
	let idofCompanies = ''
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			if (i === searchResults.length - 1) {
				idofCompanies = idofCompanies.concat(searchResults[i].company)
			}
			else {
				idofCompanies = idofCompanies.concat(`${searchResults[i].company},`)
			}
		}
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})
	searchConfig.url=`${process.env.API_ROOT_URL}companies`
	searchConfig.data=`fields name, logo; where id=(${idofCompanies});`
	let arrOfCompanies: any[] = []
	let logoids = ''
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			arrOfCompanies.push({
				name: searchResults[i].name,
				logoid: searchResults[i].logo
			})
			if (i === searchResults.length - 1) {
				logoids = logoids.concat(searchResults[i].logo)
			}
			else {
				logoids = logoids.concat(`${searchResults[i].logo},`)
			}
		}
	})
	searchConfig.url=`${process.env.API_ROOT_URL}company_logos`
	searchConfig.data=`fields url; where id=(${logoids});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			let objIndex = arrOfCompanies.findIndex((obj => obj.logoid === searchResults[i].id))
			let oldValAtIndex = arrOfCompanies[objIndex]
			arrOfCompanies[objIndex] = {
				...oldValAtIndex,
				url: searchResults[i].url
			}
		}
		responseObj.involved_companies = arrOfCompanies
	})

	searchConfig.url=`${process.env.API_ROOT_URL}keywords`
	searchConfig.data=`fields name; where id=(${responseObj.keywords});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfKeywords: string[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfKeywords.push(searchResults[i].name)
		}
		responseObj.keywords = arrOfKeywords
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	let arrOfPlatforms: any[] = []
	let platformlogoids = ''
	searchConfig.url=`${process.env.API_ROOT_URL}platforms`
	searchConfig.data=`fields name, category, platform_logo; where id=(${responseObj.platforms});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			arrOfPlatforms.push({
				name: searchResults[i].name,
				category: searchResults[i].category,
				platform_logo: searchResults[i].platform_logo
			})
			if (i === searchResults.length - 1) {
				platformlogoids = platformlogoids.concat(searchResults[i].platform_logo)
			}
			else {
				platformlogoids = platformlogoids.concat(`${searchResults[i].platform_logo},`)
			}
		}
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}platform_logos`
	searchConfig.data=`fields url; where id=(${platformlogoids});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			let objIndex = arrOfPlatforms.findIndex((obj => obj.platform_logo === searchResults[i].id))
			let oldValAtIndex = arrOfPlatforms[objIndex]
			arrOfPlatforms[objIndex] = {
				...oldValAtIndex,
				url: searchResults[i].url
			}
		}
		responseObj.platforms = arrOfPlatforms
	})

	searchConfig.url=`${process.env.API_ROOT_URL}player_perspectives`
	searchConfig.data=`fields name; where id=(${responseObj.player_perspectives});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data[0]
		responseObj.player_perspectives = searchResults.name
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}screenshots`
	searchConfig.data=`fields url; where id=(${responseObj.screenshots});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfScreenshots: string[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfScreenshots.push(searchResults[i].url)
		}
		responseObj.screenshots = arrOfScreenshots
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}games`
	searchConfig.data=`fields name; where id=(${responseObj.similar_games});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfSimilarGames: string[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfSimilarGames.push(searchResults[i].name)
		}
		responseObj.similar_games = arrOfSimilarGames
	})

	searchConfig.url=`${process.env.API_ROOT_URL}themes`
	searchConfig.data=`fields name; where id=(${responseObj.themes});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfThemes: string[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfThemes.push(searchResults[i].name)
		}
		responseObj.themes = arrOfThemes
	})

	searchConfig.url=`${process.env.API_ROOT_URL}game_videos`
	searchConfig.data=`fields name, video_id; where id=(${responseObj.videos});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfVideos: object[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfVideos.push({
				name: searchResults[i].name,
				ytlink: `https://youtube.com/watch?v=${searchResults[i].video_id}`
			})
		}
		responseObj.videos = arrOfVideos
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}websites`
	searchConfig.data=`fields category, url; where id=(${responseObj.websites});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		let arrOfSites: object[] = []
		for (let i = 0; i < searchResults.length; i++) {
			arrOfSites.push({
				category: searchResults[i].category,
				url: searchResults[i].url
			})
		}
		responseObj.websites = arrOfSites
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}language_supports`
	searchConfig.data=`fields language, language_support_type; where id=(${responseObj.language_supports});`
	let arrOfLanguages: any[] = []
	let supporttypes = ''
	let languageids = ''
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			arrOfLanguages.push({
				language: searchResults[i].language,
				language_support_type: searchResults[i].language_support_type === 1 ? 'Audio' : searchResults[i].language_support_type === 2 ? 'Subtitles' : 'Interface',
				marked: false
			})
			if (i === searchResults.length - 1) {
				supporttypes = supporttypes.concat(searchResults[i].language_support_type)
				languageids = languageids.concat(searchResults[i].language)
			}
			else {
				supporttypes = supporttypes.concat(`${searchResults[i].language_support_type},`)
				languageids = languageids.concat(`${searchResults[i].language},`)
			}
		}
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})
	//enum
	searchConfig.url=`${process.env.API_ROOT_URL}language_support_types`
	searchConfig.data=`fields name; where id=(${supporttypes});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < searchResults.length; i++) {
			let objIndex = arrOfLanguages.findIndex((obj => obj.language_support_type === searchResults[i].id))
			let oldValAtIndex = arrOfLanguages[objIndex]
			arrOfLanguages[objIndex] = {
				...oldValAtIndex,
				language_support_type: searchResults[i].name
			}
		}

	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}languages`
	searchConfig.data=`fields locale, name, native_name; where id=(${languageids});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data
		for (let i = 0; i < arrOfLanguages.length; i++) {
			let language = searchResults.filter((obj: { id: number }) => obj.id === arrOfLanguages[i].language)[0]
			let oldValAtIndex = arrOfLanguages[i]
			arrOfLanguages[i] = {
				...oldValAtIndex,
				language: language.name,
				locale: language.locale,
				native: language.native_name
			}
		}
		responseObj.language_supports = arrOfLanguages
	})
	.catch((err) => {
		console.log(err)
		errSearch = true
	})

	searchConfig.url=`${process.env.API_ROOT_URL}game_localizations`
	searchConfig.data=`fields name; where id=(${responseObj.game_localizations});`
	await axios(searchConfig)
	.then((response) => {
		searchResults = response.data[0]
		responseObj.game_localizations = searchResults.name
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