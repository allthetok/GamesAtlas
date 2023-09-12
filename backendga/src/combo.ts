/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { requestLogger, corsOptions, updateIGDBSearchConfig, SearchConfig, GameDetailObj, AgeRatings, Categories, Companies, Platforms, Videos, Languages, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, Covers } from '../helpers/requests'
require('dotenv').config()
import express, { Request, Response } from 'express'
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
	let responseObj: GameDetailObj = {
		id: null,
		age_ratings: '',
		artworks: '',
		cover: null,
		external_games: [],
		game_modes: '',
		genres: '',
		hypes: null,
		involved_companies: '',
		keywords: '' ,
		platforms: '',
		player_perspectives: '',
		screenshots: '',
		similar_games: '',
		tags: '',
		themes: '',
		videos: '',
		websites: '',
		language_supports: [],
		game_localizations: '',
		rating: null,
		ratingCount: null,
		releaseDate: null,
		likes: null,
		title: '',
		story: '',
		summary: '',
		url: ''
	}
	let errSearch = false
	let searchConfig: SearchConfig
	let arrOfSimilarGames: Covers[] = []
	let coverids: string
	const searchterm = body.searchterm
	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings,artworks,category,cover,first_release_date,external_games,follows,game_modes,genres,hypes,involved_companies,keywords,name,platforms,player_perspectives,total_rating,total_rating_count,screenshots,similar_games,slug,storyline,summary,tags,themes,url,videos,websites,language_supports,game_localizations', '', '', true, searchterm, 1)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				id: searchResults.id,
				age_ratings: searchResults.age_ratings.join(','),
				artworks: searchResults.artworks.join(','),
				cover: searchResults.cover,
				external_games: searchResults.external_games,
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
				language_supports: searchResults.language_supports,
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
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	//Catch and alter any fields (external_games, language_supports) to be split into multiple string arrays of 10 as IGDB limits each id=*string of ids* into a maximum of 10 ids searched at one time
	responseObj.external_games = splitIGDBSearch(responseObj.external_games)
	responseObj.language_supports = splitIGDBSearch(responseObj.language_supports.map(String))


	searchConfig = updateIGDBSearchConfig('age_ratings', 'category,rating', responseObj!.age_ratings, 'category=(1,2)', false, '', 0)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let age_ratingsobj: AgeRatings = {
				'ESRB': response.data[0].rating,
				'PEGI': response.data[1].rating
			}
			responseObj.age_ratings = age_ratingsobj
		})
		.catch((err) => {
			console.log(err)
		})

	searchConfig = updateIGDBSearchConfig('artworks', 'url', responseObj.artworks, '', false, '', 0)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfImages: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				searchResults[i].url = searchResults[i].url.replace('thumb', '1080p')
				arrOfImages.push(`https:${searchResults[i].url}`)
			}
			responseObj.artworks = arrOfImages
		})
		.catch((err) => {
			console.log(err)
		})

	searchConfig = updateIGDBSearchConfig('covers', 'url', responseObj.cover, '', false, '', 0)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			response.data[0].url = response.data[0].url.replace('thumb', 'cover_big')
			responseObj.cover = `https:${response.data[0].url}`
		})
		.catch((err) => {
			console.log(err)
		})
	responseObj.external_games = await getExternalGamesIter(responseObj.external_games)

	searchConfig = updateIGDBSearchConfig('game_modes', 'name', responseObj.game_modes, '', false, '', 0)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfGameModes: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfGameModes.push(searchResults[i].name)
			}
			responseObj.game_modes = arrOfGameModes
		})
		.catch((err) => {
			console.log(err)

		})


	searchConfig = updateIGDBSearchConfig('genres', 'name', responseObj.genres, '', false, '', 0)
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

		})

	searchConfig = updateIGDBSearchConfig('involved_companies', 'company', responseObj.involved_companies, '', false, '', 0)
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

		})

	searchConfig = updateIGDBSearchConfig('companies', 'name,logo', idofCompanies, '', false, '', 0)
	let arrOfCompanies: Companies[] = []
	let logoids = ''
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				arrOfCompanies.push({
					name: searchResults[i].name,
					logoid: searchResults[i].logo,
					url: ''
				})
				if (i === searchResults.length - 1) {
					logoids = logoids.concat(searchResults[i].logo)
				}
				else {
					logoids = logoids.concat(`${searchResults[i].logo},`)
				}
			}
		})

	searchConfig = updateIGDBSearchConfig('company_logos', 'url', logoids, '', false, '', 0)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				let objIndex = arrOfCompanies.findIndex((obj => obj.logoid === searchResults[i].id))
				let oldValAtIndex = arrOfCompanies[objIndex]
				arrOfCompanies[objIndex] = {
					...oldValAtIndex,
					url: `https:${searchResults[i].url}`
				}
			}
			responseObj.involved_companies = arrOfCompanies
		})


	searchConfig = updateIGDBSearchConfig('keywords', 'name', responseObj.keywords, '', false, '', 0)

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

		})

	let arrOfPlatforms: Platforms[] = []
	let platformlogoids = ''

	searchConfig = updateIGDBSearchConfig('platforms', 'name,category,platform_logo', responseObj.platforms, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				arrOfPlatforms.push({
					name: searchResults[i].name,
					category: searchResults[i].category,
					platform_logo: searchResults[i].platform_logo,
					url: ''
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

		})

	searchConfig = updateIGDBSearchConfig('platform_logos', 'url', platformlogoids, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				let objIndex = arrOfPlatforms.findIndex((obj => obj.platform_logo === searchResults[i].id))
				let oldValAtIndex = arrOfPlatforms[objIndex]
				arrOfPlatforms[objIndex] = {
					...oldValAtIndex,
					url: `https:${searchResults[i].url}`
				}
			}
			responseObj.platforms = arrOfPlatforms
		})

	searchConfig = updateIGDBSearchConfig('player_perspectives', 'name', responseObj.player_perspectives, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfPerspectives: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfPerspectives.push(searchResults[i].name)
			}
			responseObj.player_perspectives = arrOfPerspectives
		})
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('screenshots', 'url', responseObj.screenshots, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfScreenshots: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				searchResults[i].url = searchResults[i].url.replace('thumb', '1080p')
				arrOfScreenshots.push(`https:${searchResults[i].url}`)
			}
			responseObj.screenshots = arrOfScreenshots
		})
		.catch((err) => {
			console.log(err)

		})


	searchConfig = updateIGDBSearchConfig('games', 'name,cover', responseObj.similar_games, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				arrOfSimilarGames.push(
					{
						name: searchResults[i].name,
						cover: searchResults[i].cover
					}
				)
			}
			responseObj.similar_games = arrOfSimilarGames
		})
	coverids = arrOfSimilarGames.map((cov) => cov.cover).join(',')

	//get cover url's of each similar game
	searchConfig = updateIGDBSearchConfig('covers', 'url', coverids, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			searchResults = searchResults.map((cov: any) => {
				return { ...cov, url: cov.url.replace('thumb', 'cover_big') }
			})
			console.log(searchResults)
			for (let i = 0; i < searchResults.length; i++) {
				const covIndex: number = arrOfSimilarGames.findIndex((cov) => cov.cover === searchResults[i].id)
				let oldValAtIndex = arrOfSimilarGames[covIndex]
				arrOfSimilarGames[covIndex] = {
					...oldValAtIndex,
					cover: `https:${searchResults[i].url}`
				}
			}
			responseObj.similar_games = arrOfSimilarGames
		})
		.catch((err) => {
			console.log(err)
		})

	searchConfig = updateIGDBSearchConfig('themes', 'name', responseObj.themes, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfThemes: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfThemes.push(searchResults[i].name)
			}
			responseObj.themes = arrOfThemes
		})


	searchConfig = updateIGDBSearchConfig('game_videos', 'name,video_id', responseObj.videos, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfVideos: Videos[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfVideos.push({
					name: searchResults[i].name,
					ytlink: searchResults[i].video_id
				})
			}
			responseObj.videos = arrOfVideos
		})
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('websites', 'category,url', responseObj.websites, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfSites: Categories[] = []
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

		})

	responseObj.language_supports = await getLanguagesIter(responseObj.language_supports)

	searchConfig = updateIGDBSearchConfig('game_localizations', 'name', responseObj.game_localizations, '', false, '', 0)

	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj.game_localizations = searchResults.name
		})
		.catch((err) => {
			console.log(err)

		})

	return response.status(200).json(responseObj)
})

const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})

function err(reason: any): PromiseLike<never> {
	throw new Error('Function not implemented.')
}
